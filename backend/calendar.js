import { google } from 'googleapis';
import { readFileSync } from 'node:fs';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'lazarev12062005@gmail.com';
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || new URL('./secrets/google-service-account.json', import.meta.url);

const GYM_LABELS = { bern: 'Bern, Автозаводская', gmgym: 'GM Gym, ул. 1905 года' };
const FORMAT_LABELS = { personal: 'Персональная', group: 'Мини-группа' };

let calendar = null;

function getClient() {
  if (calendar) return calendar;
  const key = JSON.parse(readFileSync(KEY_FILE));
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  calendar = google.calendar({ version: 'v3', auth });
  return calendar;
}

export async function createCalendarEvent(booking) {
  const client = getClient();
  const start = `${booking.date}T${booking.time}:00`;
  const [h, m] = booking.time.split(':').map(Number);
  const endH = String(h + 1).padStart(2, '0');
  const end = `${booking.date}T${endH}:${String(m).padStart(2, '0')}:00`;

  const summary = `${FORMAT_LABELS[booking.format] || booking.format} — ${booking.name}`;
  const descriptionLines = [
    `${GYM_LABELS[booking.gym] || booking.gym}`,
    `${booking.audience}${booking.group_size ? ` (${booking.group_size} чел.)` : ''}`,
    `Телефон: ${booking.phone}`,
  ];
  if (booking.message) descriptionLines.push(`Комментарий: ${booking.message}`);
  if (booking.price) descriptionLines.push(`Цена: ${booking.price} ₽${booking.group_size ? ' / чел.' : ''}`);

  const event = await client.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary,
      description: descriptionLines.join('\n'),
      start: { dateTime: start, timeZone: 'Europe/Moscow' },
      end: { dateTime: end, timeZone: 'Europe/Moscow' },
    },
  });
  return event.data.id;
}

const BUSY_CACHE_TTL_MS = 60_000;
const busyCache = new Map(); // date -> { at, ranges }

export async function getBusyRanges(date) {
  const cached = busyCache.get(date);
  if (cached && Date.now() - cached.at < BUSY_CACHE_TTL_MS) return cached.ranges;

  const client = getClient();
  const timeMin = `${date}T00:00:00+03:00`;
  const timeMax = `${date}T23:59:59+03:00`;
  const res = await client.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: 'Europe/Moscow',
      items: [{ id: CALENDAR_ID }],
    },
  });
  const busy = res.data.calendars?.[CALENDAR_ID]?.busy || [];
  const ranges = busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
  busyCache.set(date, { at: Date.now(), ranges });
  return ranges;
}

export async function deleteCalendarEvent(eventId) {
  if (!eventId) return;
  const client = getClient();
  try {
    await client.events.delete({ calendarId: CALENDAR_ID, eventId });
  } catch (err) {
    if (err.code !== 404 && err.code !== 410) throw err;
  }
}
