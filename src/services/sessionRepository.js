import { t } from '../features/language/language.js';
import { validateSession } from '../features/tests/sessionData.js';

/** @typedef {{ id: string, patient_id: string | null, patient_name: string | null, patient_code: string | null,
 * test_id: string, started_at: string, ended_at: string, elapsed_ms: number, status: string,
 * camera_status: string, deleted_segments: number, notes: string }} SessionRecord */
const ACTIVE = '(s.patient_id IS NULL OR (p.id IS NOT NULL AND p.deleted_at IS NULL))';
const SELECT = `SELECT s.*, p.name AS patient_name, p.code AS patient_code FROM test_sessions s
  LEFT JOIN patients p ON p.id = s.patient_id AND p.owner_id = s.owner_id`;
/** @param {string} owner */
function requireOwner(owner) { if (!owner?.trim()) throw new Error(t("Cần đăng nhập để lưu phiên.")); return owner; }

/** @param {() => Promise<import('expo-sqlite').SQLiteDatabase>} getDatabase */
export function createSessionRepository(getDatabase) {
  return {
    /** @param {string} owner @param {import('../features/tests/sessionData').SessionDraft} draft @param {string} notes */
    async save(owner, draft, notes) {
      requireOwner(owner);
      validateSession(draft, notes);
      const db = await getDatabase();
      // Check ownership and existence in the same statement as the insert.
      await db.runAsync(`INSERT INTO test_sessions
        (id, owner_id, patient_id, test_id, started_at, ended_at, elapsed_ms, status, camera_status, deleted_segments, notes)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE ? IS NULL OR EXISTS (SELECT 1 FROM patients WHERE owner_id = ? AND id = ? AND deleted_at IS NULL)
        ON CONFLICT(id) DO NOTHING`,
      [draft.id, owner, draft.patientId, draft.testId, draft.startedAt, draft.endedAt, draft.elapsedMs, draft.status, draft.cameraStatus, draft.deletedSegments, notes.trim(), draft.patientId, owner, draft.patientId]);
      const saved = await db.getFirstAsync(`SELECT s.id FROM test_sessions s LEFT JOIN patients p ON p.id = s.patient_id AND p.owner_id = s.owner_id WHERE s.owner_id = ? AND s.id = ? AND ${ACTIVE}`, [owner, draft.id]);
      if (!saved) throw new Error(t("Hồ sơ đã bị xóa hoặc không thuộc tài khoản này."));
      return draft.id;
    },
    /** @param {string} owner @param {string | null} patientId @param {number} limit @param {number} offset @returns {Promise<SessionRecord[]>} */
    async list(owner, patientId = null, limit = 30, offset = 0) {
      const db = await getDatabase();
      return db.getAllAsync(`${SELECT} WHERE s.owner_id = ? AND ${ACTIVE} ${patientId ? 'AND s.patient_id = ?' : ''} ORDER BY s.ended_at DESC, s.id DESC LIMIT ? OFFSET ?`,
        patientId ? [requireOwner(owner), patientId, Math.min(100, limit), offset] : [requireOwner(owner), Math.min(100, limit), offset]);
    },
    /** @param {string} owner @param {string} id @returns {Promise<SessionRecord | null>} */
    async get(owner, id) {
      const db = await getDatabase();
      return db.getFirstAsync(`${SELECT} WHERE s.owner_id = ? AND s.id = ? AND ${ACTIVE}`, [requireOwner(owner), id]);
    },
    /** @param {string} owner @param {string} id @param {string} notes */
    async updateNotes(owner, id, notes) {
      if (notes.trim().length > 1000) throw new Error(t("Ghi chú tối đa 1.000 ký tự."));
      const db = await getDatabase();
      const result = await db.runAsync(`UPDATE test_sessions SET notes = ? WHERE owner_id = ? AND id = ? AND (patient_id IS NULL OR EXISTS (SELECT 1 FROM patients p WHERE p.owner_id = test_sessions.owner_id AND p.id = test_sessions.patient_id AND p.deleted_at IS NULL))`, [notes.trim(), requireOwner(owner), id]);
      if (!result.changes) throw new Error(t("Không tìm thấy phiên."));
    },
  };
}
