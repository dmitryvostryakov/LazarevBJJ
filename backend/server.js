import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import altchaExpress from 'altcha-lib/frameworks/express';
import { deriveKey as pbkdf2DeriveKey } from 'altcha-lib/algorithms/pbkdf2';
import { getSlotDetails, createBooking, getBookingByToken, cancelBooking, GYMS } from './bookings.js';
import { initBot, notifyNewBooking, notifyClientCancelled, stopBot } from './bot.js';
import { deleteCalendarEvent } from './calendar.js';

function publicBooking(b) {
  const { cancel_token, client_chat_id, ...rest } = b;
  return rest;
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (backend stays up):', err);
});

const ALTCHA_HMAC_KEY = process.env.ALTCHA_HMAC_KEY;
if (!ALTCHA_HMAC_KEY) {
  throw new Error('ALTCHA_HMAC_KEY is required (generate with: openssl rand -hex 32)');
}

// CappedMap tracks already-used challenges in memory so a solved captcha
// can't be replayed across multiple booking submissions.
const altcha = altchaExpress.create({
  createChallengeParameters: () => ({ algorithm: 'PBKDF2/SHA-256', cost: 50_000 }),
  deriveKey: pbkdf2DeriveKey,
  hmacSignatureSecret: ALTCHA_HMAC_KEY,
  store: new altchaExpress.CappedMap({ maxSize: 10_000 }),
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/captcha/challenge', altcha.challengeHandler);

app.get('/api/availability', async (req, res) => {
  const { gym, date } = req.query;
  if (!gym || !date || !GYMS.includes(gym)) {
    return res.status(400).json({ error: 'gym and date are required' });
  }
  try {
    res.json({ slots: await getSlotDetails(gym, date) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

app.post('/api/bookings', altcha.middleware({ throwOnFailure: false }), async (req, res) => {
  if (res.locals.altcha?.error) {
    return res.status(400).json({ error: 'captcha verification failed' });
  }
  const { gym, date, time, format, audience, groupSize, name, phone, message } = req.body || {};
  if (!gym || !date || !time || !format || !audience || !name || !phone) {
    return res.status(400).json({ error: 'missing required fields' });
  }
  if (!GYMS.includes(gym)) {
    return res.status(400).json({ error: 'unknown gym' });
  }
  try {
    const booking = createBooking({
      gym, date, time, format, audience,
      groupSize: groupSize || null,
      name, phone, message: message || null,
    });
    notifyNewBooking(booking);
    res.status(201).json({ booking });
  } catch (err) {
    if (err.code === 'SLOT_TAKEN') {
      return res.status(409).json({ error: 'slot no longer available' });
    }
    if (err.code === 'GROUP_SIZE_REQUIRED') {
      return res.status(400).json({ error: 'groupSize is required to start a new group session' });
    }
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = getBookingByToken(Number(req.params.id), req.query.token);
  if (!booking) return res.status(404).json({ error: 'not found' });
  res.json({ booking: publicBooking(booking) });
});

app.post('/api/bookings/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  const { token } = req.body || {};
  const before = getBookingByToken(id, token);
  if (!before) return res.status(404).json({ error: 'not found' });
  try {
    const booking = cancelBooking(id, token);
    if (before.calendar_event_id) {
      try {
        await deleteCalendarEvent(before.calendar_event_id);
      } catch (err) {
        console.error('Calendar event deletion failed:', err.message);
      }
    }
    notifyClientCancelled(booking);
    res.json({ booking: publicBooking(booking) });
  } catch (err) {
    if (err.code === 'ALREADY_FINAL') {
      return res.status(409).json({ error: 'booking already finalized' });
    }
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

const PORT = process.env.PORT || 3001;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_ADMIN_CHAT_IDS = (process.env.TG_ADMIN_CHAT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

if (TG_BOT_TOKEN && TG_ADMIN_CHAT_IDS.length) {
  initBot({ token: TG_BOT_TOKEN, adminChatIds: TG_ADMIN_CHAT_IDS });
  console.log(`Admin bot started with ${TG_ADMIN_CHAT_IDS.length} admin(s).`);
} else {
  console.warn('TG_BOT_TOKEN / TG_ADMIN_CHAT_IDS not set — admin bot disabled, bookings will still be stored.');
}

app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));

process.once('SIGINT', () => { stopBot(); process.exit(0); });
process.once('SIGTERM', () => { stopBot(); process.exit(0); });
