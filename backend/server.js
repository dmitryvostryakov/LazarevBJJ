import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getSlotDetails, createBooking, GYMS } from './bookings.js';
import { initBot, notifyNewBooking, stopBot } from './bot.js';

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (backend stays up):', err);
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

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

app.post('/api/bookings', (req, res) => {
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
