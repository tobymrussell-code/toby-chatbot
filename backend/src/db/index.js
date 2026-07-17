const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "design-on-a-dime.sqlite3");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id TEXT PRIMARY KEY,
  device_info TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planning_sessions (
  id TEXT PRIMARY KEY,
  anonymous_session_id TEXT NOT NULL REFERENCES anonymous_sessions(id),
  confirmed_room_type TEXT,
  goal_path TEXT,
  investor_strategy TEXT,
  style_direction TEXT,
  original_image_asset_id TEXT,
  enhanced_image_asset_id TEXT,
  report_id TEXT,
  setup_completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photo_assets (
  id TEXT PRIMARY KEY,
  planning_session_id TEXT NOT NULL REFERENCES planning_sessions(id),
  mime_type TEXT,
  byte_size INTEGER,
  width INTEGER,
  height INTEGER,
  storage_path TEXT,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  detected_room_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  planning_session_id TEXT NOT NULL REFERENCES planning_sessions(id),
  report_json TEXT NOT NULL,
  summary TEXT,
  generated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  planning_session_id TEXT NOT NULL REFERENCES planning_sessions(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  property_address TEXT,
  intent TEXT,
  created_at TEXT NOT NULL
);
`);

module.exports = db;
