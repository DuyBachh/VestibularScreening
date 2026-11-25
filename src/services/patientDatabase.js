import { t } from '../features/language/language.js';
import * as SQLite from 'expo-sqlite';
import { SESSION_SCHEMA } from '../features/tests/sessionData';
import { BRANDING_SCHEMA } from '../features/auth/reportBranding';
import { createPatientTrashRepository, PATIENT_TRASH_MIGRATION } from './patientTrashRepository';
import { ACTIVITY_SCHEMA } from './activityRepository';
import { PENDING_RUN_SCHEMA } from './pendingRunRepository';
import { BATTERY_SCHEMA } from './batteryRepository';
export const patientTrash = createPatientTrashRepository(getDatabase);

const DATABASE_NAME = 'vestibular-screening.db';
const MAX_RESULTS = 200;
/** @type {Promise<SQLite.SQLiteDatabase> | undefined} */
let databasePromise;

/** @typedef {{ id: string, code: string, name: string, birth_date: string, gender: string, notes: string, created_at: string, updated_at: string }} PatientRecord */

/** @returns {Promise<SQLite.SQLiteDatabase>} */
export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await database.execAsync('PRAGMA journal_mode = WAL;');
      await database.execAsync('PRAGMA foreign_keys = ON;');
      const version = await database.getFirstAsync('PRAGMA user_version');
      if ((version?.user_version ?? 0) < 1) {
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY NOT NULL,
            owner_id TEXT NOT NULL,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            birth_date TEXT NOT NULL DEFAULT '',
            gender TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            search_key TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(owner_id, code)
          );
          CREATE INDEX IF NOT EXISTS patients_owner_updated
          ON patients(owner_id, updated_at DESC);
          CREATE INDEX IF NOT EXISTS patients_owner_search
          ON patients(owner_id, search_key);
          PRAGMA user_version = 1;
        `);
      }
      if ((version?.user_version ?? 0) < 2) {
        await database.runAsync(
          "UPDATE patients SET gender = '' WHERE gender NOT IN (?, ?)",
          ['Nam', 'Nữ'],
        );
        await database.execAsync('PRAGMA user_version = 2;');
      }
      if ((version?.user_version ?? 0) < 3) {
        await database.withTransactionAsync(async () => {
          await database.execAsync(`${SESSION_SCHEMA} PRAGMA user_version = 3;`);
        });
      }
      if ((version?.user_version ?? 0) < 4) {
        await database.withTransactionAsync(async () => {
          await database.execAsync(`${PATIENT_TRASH_MIGRATION} PRAGMA user_version = 4;`);
        });
      }
      if ((version?.user_version ?? 0) < 5) {
        await database.withTransactionAsync(async () => {
          await database.execAsync(`${BRANDING_SCHEMA} PRAGMA user_version = 5;`);
        });
      }
      if ((version?.user_version ?? 0) < 6) {
        await database.withTransactionAsync(async () => {
          await database.execAsync(`${ACTIVITY_SCHEMA} PRAGMA user_version = 6;`);
        });
      }
      if ((version?.user_version ?? 0) < 7) {
        await database.withTransactionAsync(async () => {
          await database.execAsync(`${PENDING_RUN_SCHEMA} PRAGMA user_version = 7;`);
        });
      }
      if ((version?.user_version ?? 0) < 8) {
        await database.withTransactionAsync(async () => { await database.execAsync(`${BATTERY_SCHEMA} PRAGMA user_version = 8;`); });
      }
      return database;
    })().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

/** @param {string} ownerId */
function requireOwner(ownerId) {
  if (typeof ownerId !== 'string' || !ownerId.trim()) {
    throw new Error(t("Không xác định được tài khoản đang đăng nhập."));
  }
  return ownerId;
}

/** @param {string} value */
function normalizeSearch(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[%_]/g, '');
}

/** @param {string} name @param {string} code */
function makeSearchKey(name, code) {
  return normalizeSearch(`${name} ${code}`);
}

function makeId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeGeneratedCode() {
  return `BN-${Date.now().toString(36).slice(-5).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

/** @param {{ name: string, code: string, birthDate: string, gender: string, notes: string }} values */
function toPatientFields(values) {
  const name = values.name.trim();
  const code = values.code.trim().toUpperCase() || makeGeneratedCode();
  return {
    code,
    name,
    birthDate: values.birthDate.trim(),
    gender: values.gender,
    notes: values.notes.trim(),
    searchKey: makeSearchKey(name, code),
  };
}

/**
 * @param {string} ownerId
 * @param {string} search
 * @returns {Promise<PatientRecord[]>}
 */
export async function listPatients(ownerId, search = '') {
  const owner = requireOwner(ownerId);
  await patientTrash.purgeExpired(owner);
  const database = await getDatabase();
  const key = normalizeSearch(search);
  if (!key) {
    return /** @type {Promise<PatientRecord[]>} */ (database.getAllAsync(
      'SELECT id, code, name, birth_date, gender, notes, created_at, updated_at FROM patients WHERE owner_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT ?',
      [owner, MAX_RESULTS],
    ));
  }
  return /** @type {Promise<PatientRecord[]>} */ (database.getAllAsync(
    'SELECT id, code, name, birth_date, gender, notes, created_at, updated_at FROM patients WHERE owner_id = ? AND deleted_at IS NULL AND search_key LIKE ? ORDER BY updated_at DESC LIMIT ?',
    [owner, `%${key}%`, MAX_RESULTS],
  ));
}

/**
 * @param {string} ownerId
 * @param {string} patientId
 * @returns {Promise<PatientRecord | null>}
 */
export async function getPatient(ownerId, patientId) {
  const database = await getDatabase();
  return database.getFirstAsync(
    'SELECT id, code, name, birth_date, gender, notes, created_at, updated_at FROM patients WHERE owner_id = ? AND id = ? AND deleted_at IS NULL',
    [requireOwner(ownerId), patientId],
  );
}

/**
 * @param {string} ownerId
 * @param {{ name: string, code: string, birthDate: string, gender: string, notes: string }} values
 */
export async function createPatient(ownerId, values) {
  await patientTrash.purgeExpired(requireOwner(ownerId));
  const database = await getDatabase();
  const now = new Date().toISOString();
  const patient = toPatientFields(values);
  const id = makeId();
  await database.runAsync(
    'INSERT INTO patients (id, owner_id, code, name, birth_date, gender, notes, search_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, requireOwner(ownerId), patient.code, patient.name, patient.birthDate, patient.gender, patient.notes, patient.searchKey, now, now],
  );
  return id;
}

/**
 * @param {string} ownerId
 * @param {string} patientId
 * @param {{ name: string, code: string, birthDate: string, gender: string, notes: string }} values
 */
export async function updatePatient(ownerId, patientId, values) {
  const database = await getDatabase();
  const patient = toPatientFields(values);
  const result = await database.runAsync(
    'UPDATE patients SET code = ?, name = ?, birth_date = ?, gender = ?, notes = ?, search_key = ?, updated_at = ? WHERE owner_id = ? AND id = ? AND deleted_at IS NULL',
    [patient.code, patient.name, patient.birthDate, patient.gender, patient.notes, patient.searchKey, new Date().toISOString(), requireOwner(ownerId), patientId],
  );
  return result.changes > 0;
}

/**
 * @param {string} ownerId
 * @param {string} patientId
 */
export async function deletePatient(ownerId, patientId) {
  return patientTrash.moveToTrash(requireOwner(ownerId), patientId);
}

/** @param {unknown} error */
export function isDuplicatePatientCode(error) {
  if (typeof error !== 'object' || error === null || !('message' in error)) return false;
  return String(error.message ?? '').toLowerCase().includes('unique constraint failed');
}
