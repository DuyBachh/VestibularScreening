import { t } from '../features/language/language.js';
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const PATIENT_TRASH_MIGRATION = `ALTER TABLE patients ADD COLUMN deleted_at INTEGER;
  CREATE INDEX patients_owner_deleted ON patients(owner_id, deleted_at);`;
/** @typedef {import('./patientDatabase').PatientRecord & {deleted_at: number, session_count: number}} TrashPatient */
/** @param {string} owner */
function requireOwner(owner) { if (!owner?.trim()) throw new Error(t("Cần đăng nhập để mở thùng rác.")); return owner; }
/** @param {() => Promise<import('expo-sqlite').SQLiteDatabase>} getDatabase @param {() => number} now */
export function createPatientTrashRepository(getDatabase, now = Date.now) {
  /** @param {string} owner */
  async function purgeExpired(owner) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM patients WHERE owner_id = ? AND deleted_at IS NOT NULL AND deleted_at <= ?', [requireOwner(owner), now() - RETENTION_MS]);
  }
  return {
    purgeExpired,
    /** @param {string} owner @param {number} offset @returns {Promise<TrashPatient[]>} */
    async list(owner, offset = 0) {
      await purgeExpired(owner);
      const db = await getDatabase();
      return db.getAllAsync(`SELECT p.*, (SELECT COUNT(*) FROM test_sessions s WHERE s.owner_id = p.owner_id AND s.patient_id = p.id) AS session_count
        FROM patients p WHERE p.owner_id = ? AND p.deleted_at IS NOT NULL ORDER BY p.deleted_at DESC, p.id DESC LIMIT 30 OFFSET ?`, [requireOwner(owner), offset]);
    },
    /** @param {string} owner @param {string} id */
    async moveToTrash(owner, id) {
      await purgeExpired(owner);
      const db = await getDatabase();
      const result = await db.runAsync('UPDATE patients SET deleted_at = ?, updated_at = ? WHERE owner_id = ? AND id = ? AND deleted_at IS NULL', [now(), new Date(now()).toISOString(), requireOwner(owner), id]);
      return result.changes > 0;
    },
    /** @param {string} owner @param {string} id */
    async restore(owner, id) {
      await purgeExpired(owner);
      const db = await getDatabase();
      const result = await db.runAsync('UPDATE patients SET deleted_at = NULL, updated_at = ? WHERE owner_id = ? AND id = ? AND deleted_at > ?', [new Date(now()).toISOString(), requireOwner(owner), id, now() - RETENTION_MS]);
      return result.changes > 0;
    },
    /** @param {string} owner @param {string} id */
    async removePermanently(owner, id) {
      const db = await getDatabase();
      const result = await db.runAsync('DELETE FROM patients WHERE owner_id = ? AND id = ? AND deleted_at IS NOT NULL', [requireOwner(owner), id]);
      return result.changes > 0;
    },
  };
}
