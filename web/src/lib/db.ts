import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });
const db = new DatabaseSync(path.join(dataDirectory, "hemosync.db"));

db.exec(`
  PRAGMA busy_timeout = 10000;
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, full_name TEXT NOT NULL, date_of_birth TEXT NOT NULL, sex TEXT NOT NULL, email TEXT NOT NULL, mobile_number TEXT NOT NULL, consent_given_at TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS screening_sessions (id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id), status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'cancelled')), started_at TEXT NOT NULL, completed_at TEXT);
  CREATE UNIQUE INDEX IF NOT EXISTS one_active_session ON screening_sessions(status) WHERE status = 'active';
  CREATE TABLE IF NOT EXISTS measurements (id TEXT PRIMARY KEY, upload_id TEXT NOT NULL UNIQUE, screening_session_id TEXT NOT NULL UNIQUE REFERENCES screening_sessions(id), heart_rate_bpm INTEGER, spo2_percent INTEGER, heart_rate_valid INTEGER NOT NULL, spo2_valid INTEGER NOT NULL, average_ir INTEGER NOT NULL, measured_at TEXT NOT NULL, received_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS ai_assessments (id TEXT PRIMARY KEY, screening_session_id TEXT NOT NULL UNIQUE REFERENCES screening_sessions(id), summary TEXT NOT NULL, suggestions TEXT NOT NULL, spoken_text TEXT NOT NULL, model TEXT NOT NULL, created_at TEXT NOT NULL);
`);

function addColumn(table: string, definition: string) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const name = definition.split(" ")[0];
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!columns.some((column) => column.name === name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

addColumn("patients", "updated_at TEXT");
addColumn("patients", "archived_at TEXT");
addColumn("patients", "municipality TEXT");
addColumn("patients", "province TEXT");
addColumn("screening_sessions", "cancelled_at TEXT");
addColumn("screening_sessions", "cancel_reason TEXT");
addColumn("measurements", "finger_present INTEGER");
addColumn("measurements", "signal_quality TEXT");
addColumn("measurements", "sample_window_count INTEGER");
addColumn("measurements", "valid_window_count INTEGER");
addColumn("measurements", "heart_rate_min INTEGER");
addColumn("measurements", "heart_rate_max INTEGER");
addColumn("measurements", "spo2_min INTEGER");
addColumn("measurements", "spo2_max INTEGER");

db.exec(`
  UPDATE patients SET updated_at = created_at WHERE updated_at IS NULL;
  CREATE INDEX IF NOT EXISTS patients_name ON patients(full_name);
  CREATE INDEX IF NOT EXISTS patients_email ON patients(email);
  CREATE INDEX IF NOT EXISTS sessions_patient_started ON screening_sessions(patient_id, started_at DESC);
  CREATE TABLE IF NOT EXISTS device_status (
    device_id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    finger_present INTEGER NOT NULL DEFAULT 0,
    average_ir INTEGER,
    signal_quality TEXT NOT NULL DEFAULT 'unknown',
    active_session_id TEXT,
    firmware_version TEXT,
    last_seen_at TEXT NOT NULL,
    error_code TEXT
  );
  CREATE TABLE IF NOT EXISTS device_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    command TEXT NOT NULL CHECK(command IN ('start', 'stop')),
    session_id TEXT,
    created_at TEXT NOT NULL,
    acknowledged_at TEXT
  );
`);

addColumn("device_status", "heart_rate_bpm INTEGER");
addColumn("device_status", "spo2_percent INTEGER");

export default db;