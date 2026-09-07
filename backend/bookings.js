import crypto from 'node:crypto';
import { db } from './db.js';
import { getBusyRanges } from './calendar.js';

export const GYMS = ['bern', 'gmgym'];
export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

const PERSONAL_PRICE = { kids: 4000, adults: 4500 };
// Fixed per-person rate regardless of group size (2, 3 or 4 человека).
const GROUP_PRICE_PER_HEAD = 2750;

function getPersonalPrice(audience) {
  return PERSONAL_PRICE[audience] ?? PERSONAL_PRICE.adults;
}

const activeAtSlotStmt = db.prepare(`
  SELECT * FROM bookings WHERE gym = ? AND date = ? AND time = ? AND status IN ('pending', 'confirmed')
`);
const blockedStmt = db.prepare(`
  SELECT time FROM blocked_slots WHERE gym = ? AND date = ?
`);

function slotOverlapsBusy(date, time, busyRanges) {
  if (!busyRanges.length) return false;
  const start = new Date(`${date}T${time}:00+03:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return busyRanges.some((b) => start < b.end && end > b.start);
}

// Returns status for every hourly slot in a day (always the full TIME_SLOTS
// list, so the frontend can render a grid and show occupied hours instead of
// just hiding them). status is one of:
//   'open'            — free, either format can start here
//   'group_joinable'  — an open mini-group session with room left
//   'taken'           — blocked, personal booking, full group, or conflicts
//                       with Nikita's own calendar (no further detail leaked)
export async function getSlotDetails(gym, date) {
  const blocked = new Set(blockedStmt.all(gym, date).map((r) => r.time));

  let busyRanges = [];
  try {
    busyRanges = await getBusyRanges(date);
  } catch (err) {
    console.error('Calendar busy lookup failed, falling back to DB-only availability:', err.message);
  }

  const result = [];
  for (const time of TIME_SLOTS) {
    if (blocked.has(time)) {
      result.push({ time, status: 'taken' });
      continue;
    }

    const rows = activeAtSlotStmt.all(gym, date, time);

    // Only consult Nikita's own calendar for slots we have no booking for yet —
    // once we've confirmed a booking here, its own calendar event would otherwise
    // show up as "busy" and wrongly hide the slot from further group joins.
    if (rows.length === 0) {
      if (slotOverlapsBusy(date, time, busyRanges)) {
        result.push({ time, status: 'taken' });
        continue;
      }
      result.push({ time, status: 'open' });
      continue;
    }
    if (rows.some((r) => r.format === 'personal')) {
      result.push({ time, status: 'taken' });
      continue;
    }

    const groupSize = rows[0].group_size;
    const joined = rows.length;
    const remaining = groupSize - joined;
    if (remaining <= 0) {
      result.push({ time, status: 'taken' });
      continue;
    }
    result.push({
      time,
      status: 'group_joinable',
      groupSize,
      joined,
      remaining,
      pricePerHead: rows[0].price,
    });
  }
  return result;
}

const insertStmt = db.prepare(`
  INSERT INTO bookings (gym, date, time, format, audience, group_size, name, phone, message, price, status, cancel_token)
  VALUES (@gym, @date, @time, @format, @audience, @groupSize, @name, @phone, @message, @price, 'pending', @cancelToken)
`);

export const createBooking = db.transaction((rawPayload) => {
  const payload = { message: null, ...rawPayload, cancelToken: crypto.randomBytes(16).toString('hex') };
  const rows = activeAtSlotStmt.all(payload.gym, payload.date, payload.time);

  if (payload.format === 'personal') {
    if (rows.length > 0) {
      const err = new Error('SLOT_TAKEN');
      err.code = 'SLOT_TAKEN';
      throw err;
    }
    const price = getPersonalPrice(payload.audience);
    const info = insertStmt.run({ ...payload, groupSize: null, price });
    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
  }

  // group
  if (rows.some((r) => r.format === 'personal')) {
    const err = new Error('SLOT_TAKEN');
    err.code = 'SLOT_TAKEN';
    throw err;
  }

  let groupSize;
  let price;
  if (rows.length > 0) {
    groupSize = rows[0].group_size;
    if (rows.length >= groupSize) {
      const err = new Error('SLOT_TAKEN');
      err.code = 'SLOT_TAKEN';
      throw err;
    }
    price = rows[0].price;
  } else {
    if (!payload.groupSize) {
      const err = new Error('GROUP_SIZE_REQUIRED');
      err.code = 'GROUP_SIZE_REQUIRED';
      throw err;
    }
    groupSize = payload.groupSize;
    price = GROUP_PRICE_PER_HEAD;
  }

  const info = insertStmt.run({ ...payload, groupSize, price });
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
});

export function getBooking(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
}

export function countActiveAtSlot(gym, date, time) {
  return activeAtSlotStmt.all(gym, date, time).length;
}

export function setBookingStatus(id, status, calendarEventId) {
  if (calendarEventId !== undefined) {
    db.prepare('UPDATE bookings SET status = ?, calendar_event_id = ? WHERE id = ?').run(status, calendarEventId, id);
  } else {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
  }
  return getBooking(id);
}

export function listPending() {
  return db.prepare(`SELECT * FROM bookings WHERE status = 'pending' ORDER BY date, time`).all();
}

export function listUpcoming() {
  return db.prepare(`
    SELECT * FROM bookings
    WHERE status = 'confirmed' AND date >= date('now')
    ORDER BY date, time
  `).all();
}

const blockStmt = db.prepare(`
  INSERT OR IGNORE INTO blocked_slots (gym, date, time, reason) VALUES (?, ?, ?, ?)
`);
export function blockSlot(gym, date, time, reason) {
  return blockStmt.run(gym, date, time, reason || null);
}

export function unblockSlot(gym, date, time) {
  return db.prepare('DELETE FROM blocked_slots WHERE gym = ? AND date = ? AND time = ?').run(gym, date, time);
}

// Public lookup for the client-facing status link/bot — requires the booking's
// own cancel_token, so knowing an id alone reveals nothing.
export function getBookingByToken(id, token) {
  if (!token) return null;
  const booking = getBooking(id);
  if (!booking || booking.cancel_token !== token) return null;
  return booking;
}

export function cancelBooking(id, token) {
  const booking = getBookingByToken(id, token);
  if (!booking) {
    const err = new Error('NOT_FOUND');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!['pending', 'confirmed'].includes(booking.status)) {
    const err = new Error('ALREADY_FINAL');
    err.code = 'ALREADY_FINAL';
    throw err;
  }
  return setBookingStatus(id, 'cancelled', null);
}

export function setClientChatId(id, chatId) {
  db.prepare('UPDATE bookings SET client_chat_id = ? WHERE id = ?').run(String(chatId), id);
  return getBooking(id);
}
