import { t } from '../features/language/language.js';
import { isSupportedTest } from '../features/tests/catalog.js';
import { validateSession } from '../features/tests/sessionData.js';
import { createSessionRepository } from './sessionRepository.js';

export const PENDING_RUN_SCHEMA = `
CREATE TABLE IF NOT EXISTS pending_runs (
  id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, patient_id TEXT,
  test_id TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL, elapsed_ms INTEGER NOT NULL DEFAULT 0 CHECK(elapsed_ms BETWEEN 0 AND 30000),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','cancelled')),
  camera_status TEXT NOT NULL CHECK(camera_status IN ('not_used','pending','deleted','error')),
  deleted_segments INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', revision INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(owner_id,patient_id) REFERENCES patients(owner_id,id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS pending_owner_date ON pending_runs(owner_id,updated_at DESC,id DESC);
CREATE TRIGGER IF NOT EXISTS pending_remove_on_save AFTER INSERT ON test_sessions BEGIN
  DELETE FROM pending_runs WHERE owner_id=NEW.owner_id AND id=NEW.id;
END;
`;
/** @typedef {{id: string, owner_id: string, patient_id: string | null, patient_name: string | null, patient_code: string | null, test_id: string, started_at: string, ended_at: string, updated_at: string, elapsed_ms: number, status: string, camera_status: string, deleted_segments: number, notes: string, revision: number}} PendingRun */
/** @typedef {{elapsedMs: number, status: string, endedAt: string, cameraStatus: string, deletedSegments: number, notes: string}} RunCheckpoint */
const ACTIVE = '(d.patient_id IS NULL OR (p.id IS NOT NULL AND p.deleted_at IS NULL))';
const SELECT = `SELECT d.*,p.name AS patient_name,p.code AS patient_code FROM pending_runs d
  LEFT JOIN patients p ON p.owner_id=d.owner_id AND p.id=d.patient_id`;
const UNSAVED = 'NOT EXISTS (SELECT 1 FROM test_sessions s WHERE s.id=d.id)';
/** @param {string} owner */
function requireOwner(owner) { if (!owner?.trim()) throw new Error(t('Cần đăng nhập để quản lý bản nháp.')); }
/** @param {PendingRun} row @returns {import('../features/tests/sessionData.js').SessionDraft} */
export function pendingSession(row) {
  return { id: row.id, patientId: row.patient_id, testId: row.test_id, startedAt: row.started_at, endedAt: row.ended_at, elapsedMs: row.elapsed_ms, status: row.status, cameraStatus: row.camera_status, deletedSegments: row.deleted_segments };
}
/** @param {PendingRun} row @returns {RunCheckpoint} */
export function pendingCheckpoint(row) {
  return { elapsedMs: row.elapsed_ms, status: row.status, endedAt: row.ended_at, cameraStatus: row.camera_status, deletedSegments: row.deleted_segments, notes: row.notes };
}
/** @param {RunCheckpoint} snapshot */
function validateCheckpoint(snapshot) {
  if (!['active', 'completed', 'cancelled'].includes(snapshot.status) || !Number.isInteger(snapshot.elapsedMs) || snapshot.elapsedMs < 0 || snapshot.elapsedMs > 30000 || typeof snapshot.notes !== 'string' || snapshot.notes.length > 1000 || !['not_used', 'pending', 'deleted', 'error'].includes(snapshot.cameraStatus) || !Number.isInteger(snapshot.deletedSegments) || snapshot.deletedSegments < 0) throw new Error(t('Bản nháp không hợp lệ.'));
  if (snapshot.status !== 'active' && (!Number.isFinite(Date.parse(snapshot.endedAt)) || snapshot.cameraStatus === 'pending' || (snapshot.status === 'completed' && snapshot.elapsedMs !== 30000))) throw new Error(t('Bản nháp chưa đủ điều kiện khôi phục kết quả.'));
  if (snapshot.cameraStatus === 'not_used' && snapshot.deletedSegments !== 0) throw new Error(t('Dữ liệu camera không nhất quán.'));
  if (snapshot.cameraStatus === 'deleted' && snapshot.elapsedMs > 0 && snapshot.deletedSegments === 0) throw new Error(t('Chưa xác nhận xóa video.'));
}

/** @param {() => Promise<import('expo-sqlite').SQLiteDatabase>} getDatabase */
export function createPendingRunRepository(getDatabase) {
  return {
    /** Create once before starting; later writes only UPDATE so deletion cannot be undone by a delayed writer.
     * @param {string} owner @param {{id: string, patientId: string | null, testId: string, startedAt: string, withCamera: boolean}} run @param {() => boolean} isCurrent */
    async begin(owner, run, isCurrent) {
      requireOwner(owner);
      if (!run.id || !isSupportedTest(run.testId) || !Number.isFinite(Date.parse(run.startedAt))) throw new Error(t('Bản nháp không hợp lệ.'));
      const guard = () => { if (!isCurrent()) throw new Error(t('Tài khoản đã thay đổi.')); };
      guard(); const db = await getDatabase(); guard();
      await db.withExclusiveTransactionAsync(async (tx) => {
        guard();
        const inserted = await tx.runAsync(`INSERT INTO pending_runs (id,owner_id,patient_id,test_id,started_at,updated_at,camera_status)
          SELECT ?,?,?,?,?,?,? WHERE (? IS NULL OR EXISTS(SELECT 1 FROM patients WHERE owner_id=? AND id=? AND deleted_at IS NULL))
          AND NOT EXISTS(SELECT 1 FROM test_sessions WHERE id=?) ON CONFLICT(id) DO NOTHING`,
        [run.id, owner, run.patientId, run.testId, run.startedAt, run.startedAt, run.withCamera ? 'pending' : 'not_used', run.patientId, owner, run.patientId, run.id]);
        if (!inserted.changes) throw new Error(t('Không tạo được bản nháp. Hồ sơ có thể đã thay đổi.'));
        guard();
      });
    },
    /** @param {string} owner @param {string} id @param {RunCheckpoint} snapshot @param {number} revision */
    async update(owner, id, snapshot, revision) {
      requireOwner(owner); validateCheckpoint(snapshot);
      if (!Number.isSafeInteger(revision) || revision < 1) throw new Error(t('Bản nháp không hợp lệ.'));
      const db = await getDatabase();
      const result = await db.runAsync(`UPDATE pending_runs SET elapsed_ms=?,status=?,ended_at=?,camera_status=?,deleted_segments=?,notes=?,revision=?,updated_at=?
        WHERE owner_id=? AND id=? AND revision<? AND elapsed_ms<=? AND deleted_segments<=?
        AND (status='active' OR status=?) AND NOT EXISTS(SELECT 1 FROM test_sessions WHERE id=pending_runs.id)
        AND (?='active' OR (julianday(?)>=julianday(started_at) AND (julianday(?)-julianday(started_at))*86400000+1000>=?))
        AND (patient_id IS NULL OR EXISTS(SELECT 1 FROM patients WHERE owner_id=pending_runs.owner_id AND id=pending_runs.patient_id AND deleted_at IS NULL))`,
      [snapshot.elapsedMs, snapshot.status, snapshot.endedAt, snapshot.cameraStatus, snapshot.deletedSegments, snapshot.notes, revision, new Date().toISOString(), owner, id, revision, snapshot.elapsedMs, snapshot.deletedSegments, snapshot.status, snapshot.status, snapshot.endedAt, snapshot.endedAt, snapshot.elapsedMs]);
      return result.changes > 0;
    },
    /** @param {string} owner @param {number} [offset] @returns {Promise<PendingRun[]>} */
    async list(owner, offset = 0) {
      requireOwner(owner); const db = await getDatabase();
      return db.getAllAsync(`${SELECT} WHERE d.owner_id=? AND ${ACTIVE} AND ${UNSAVED} ORDER BY d.updated_at DESC,d.id DESC LIMIT 30 OFFSET ?`, [owner, Math.max(0, Math.floor(offset))]);
    },
    /** @param {string} owner */
    async count(owner) {
      requireOwner(owner); const db = await getDatabase();
      const row = await db.getFirstAsync(`SELECT COUNT(*) AS total FROM pending_runs d LEFT JOIN patients p ON p.owner_id=d.owner_id AND p.id=d.patient_id WHERE d.owner_id=? AND ${ACTIVE} AND ${UNSAVED}`, [owner]);
      return Number(row?.total || 0);
    },
    /** @param {string} owner @param {string} id @returns {Promise<PendingRun | null>} */
    async get(owner, id) {
      requireOwner(owner); const db = await getDatabase();
      return db.getFirstAsync(`${SELECT} WHERE d.owner_id=? AND d.id=? AND ${ACTIVE} AND ${UNSAVED}`, [owner, id]);
    },
    /** @param {string} owner @param {string} id */
    async remove(owner, id) {
      requireOwner(owner); const db = await getDatabase();
      await db.runAsync('DELETE FROM pending_runs WHERE owner_id=? AND id=?', [owner, id]);
    },
    /** Saving history and deleting the draft share one transaction, including on retry.
     * @param {string} owner @param {string} id @param {string} notes @param {() => boolean} isCurrent */
    async recover(owner, id, notes, isCurrent) {
      requireOwner(owner);
      const guard = () => { if (!isCurrent()) throw new Error(t('Tài khoản đã thay đổi.')); };
      guard(); const db = await getDatabase(); guard();
      await db.withExclusiveTransactionAsync(async (tx) => {
        guard();
        const row = /** @type {PendingRun | null} */ (await tx.getFirstAsync(`${SELECT} WHERE d.owner_id=? AND d.id=? AND ${ACTIVE} AND ${UNSAVED}`, [owner, id]));
        if (!row) throw new Error(t('Bản nháp không còn tồn tại hoặc hồ sơ đã thay đổi.'));
        const draft = pendingSession(row);
        // Active checkpoints never become completed results, even at 30,000 ms.
        if (row.status === 'active') throw new Error(t('Lượt gián đoạn không phải kết quả hoàn tất. Hãy chuẩn bị bài mới.'));
        validateSession(draft, notes);
        await createSessionRepository(async () => tx).save(owner, draft, notes);
        await tx.runAsync('DELETE FROM pending_runs WHERE owner_id=? AND id=?', [owner, id]);
        guard();
      });
    },
  };
}
