import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'bookings.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gym TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    format TEXT NOT NULL,
    audience TEXT NOT NULL,
    group_size INTEGER,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT,
    price INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    calendar_event_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Personal bookings claim the whole slot exclusively; group slots can hold
  -- multiple active rows up to the session's group_size (enforced in app code).
  DROP INDEX IF EXISTS idx_slot_active;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_slot_active
    ON bookings (gym, date, time)
    WHERE status IN ('pending', 'confirmed') AND format = 'personal';

  CREATE TABLE IF NOT EXISTS blocked_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gym TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (gym, date, time)
  );
`);
