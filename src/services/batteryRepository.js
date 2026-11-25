import { t } from '../features/language/language.js';
import { supportedTests } from '../features/tests/catalog.js';
import { resolveBatteryItem } from '../features/tests/batteryRecord.js';

export const BATTERY_SCHEMA = `
CREATE TABLE IF NOT EXISTS battery_runs (
  id TEXT PRIMARY KEY NOT NULL,owner_id TEXT NOT NULL,patient_id TEXT,created_at TEXT NOT NULL,ended_at TEXT NOT NULL DEFAULT '',camera_requested INTEGER NOT NULL CHECK(camera_requested IN (0,1)),
  UNIQUE(owner_id,id),FOREIGN KEY(owner_id,patient_id) REFERENCES patients(owner_id,id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS battery_items (
  owner_id TEXT NOT NULL,battery_id TEXT NOT NULL,ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 5),test_id TEXT NOT NULL,session_id TEXT UNIQUE,
  phase TEXT NOT NULL DEFAULT 'planned' CHECK(phase IN ('planned','active','completed','cancelled')),
  elapsed_ms INTEGER NOT NULL DEFAULT 0 CHECK(elapsed_ms BETWEEN 0 AND 30000),camera_error INTEGER NOT NULL DEFAULT 0 CHECK(camera_error IN (0,1)),
  PRIMARY KEY(owner_id,battery_id,ordinal),FOREIGN KEY(owner_id,battery_id) REFERENCES battery_runs(owner_id,id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS battery_owner_date ON battery_runs(owner_id,created_at DESC,id DESC);
CREATE TRIGGER IF NOT EXISTS battery_session_saved AFTER INSERT ON test_sessions BEGIN
  UPDATE battery_items SET phase=NEW.status,elapsed_ms=NEW.elapsed_ms,camera_error=CASE WHEN NEW.camera_status='error' THEN 1 ELSE 0 END
  WHERE owner_id=NEW.owner_id AND session_id=NEW.id AND test_id=NEW.test_id
  AND EXISTS(SELECT 1 FROM battery_runs b WHERE b.owner_id=NEW.owner_id AND b.id=battery_items.battery_id AND b.patient_id IS NEW.patient_id);
END;
`;
/** @typedef {{id: string,owner_id: string,patient_id: string | null,patient_name: string | null,patient_code: string | null,birth_date: string | null,gender: string | null,created_at: string,ended_at: string,camera_requested: number,saved_count?: number}} BatteryRow */
/** @typedef {BatteryRow & {items: import('../features/tests/batteryRecord.js').BatteryItem[]}} RecordedBattery */
const ROOT = `SELECT b.*,p.name AS patient_name,p.code AS patient_code,p.birth_date,p.gender FROM battery_runs b LEFT JOIN patients p ON p.owner_id=b.owner_id AND p.id=b.patient_id`;
const ACTIVE = '(b.patient_id IS NULL OR (p.id IS NOT NULL AND p.deleted_at IS NULL))';
/** @param {string} owner */
function requireOwner(owner) { if (!owner?.trim()) throw new Error(t('Cần đăng nhập để quản lý chuỗi đã lưu.')); }
/** @param {() => boolean} isCurrent */
function guard(isCurrent) { if (!isCurrent()) throw new Error(t('Tài khoản đã thay đổi.')); }

/** Bind a run and its draft in the same transaction, before any camera/stimulus starts.
 * @param {import('expo-sqlite').SQLiteDatabase} tx @param {string} owner
 * @param {{batteryId: string,ordinal: number}} ref @param {{id: string,patientId: string | null,testId: string}} run */
export async function attachBatteryExercise(tx, owner, ref, run) {
  if (!Number.isInteger(ref.ordinal) || ref.ordinal < 0 || ref.ordinal >= supportedTests.length || supportedTests[ref.ordinal].id !== run.testId) throw new Error(t('Thứ tự bài trong chuỗi không hợp lệ.'));
  const changed = await tx.runAsync(`UPDATE battery_items SET session_id=?,phase='active' WHERE owner_id=? AND battery_id=? AND ordinal=? AND test_id=? AND phase='planned'
    AND EXISTS(SELECT 1 FROM battery_runs b WHERE b.owner_id=? AND b.id=? AND b.ended_at='' AND b.patient_id IS ?)
    AND NOT EXISTS(SELECT 1 FROM battery_items previous WHERE previous.owner_id=? AND previous.battery_id=? AND previous.ordinal<? AND previous.phase IN ('planned','active'))`,
  [run.id, owner, ref.batteryId, ref.ordinal, run.testId, owner, ref.batteryId, run.patientId, owner, ref.batteryId, ref.ordinal]);
  if (!changed.changes) throw new Error(t('Chuỗi đã thay đổi hoặc bài trước chưa kết thúc.'));
}
export function makeBatteryId() { return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`; }

/** @param {() => Promise<import('expo-sqlite').SQLiteDatabase>} getDatabase */
export function createBatteryRepository(getDatabase) {
  return {
    /** @param {string} owner @param {{id: string,patientId: string | null,camera: boolean}} input @param {() => boolean} isCurrent */
    async create(owner, input, isCurrent) {
      requireOwner(owner); guard(isCurrent);
      const db = await getDatabase(); guard(isCurrent);
      await db.withExclusiveTransactionAsync(async (tx) => {
        guard(isCurrent);
        if (!input.id) throw new Error(t('Chuỗi không hợp lệ.'));
        const inserted = await tx.runAsync(`INSERT INTO battery_runs(id,owner_id,patient_id,created_at,camera_requested) SELECT ?,?,?,?,?
          WHERE ? IS NULL OR EXISTS(SELECT 1 FROM patients WHERE owner_id=? AND id=? AND deleted_at IS NULL)`,
        [input.id, owner, input.patientId, new Date().toISOString(), input.camera ? 1 : 0, input.patientId, owner, input.patientId]);
        if (!inserted.changes) throw new Error(t('Hồ sơ đã thay đổi. Chưa bắt đầu chuỗi.'));
        for (let i = 0; i < supportedTests.length; i++) await tx.runAsync('INSERT INTO battery_items(owner_id,battery_id,ordinal,test_id) VALUES(?,?,?,?)', [owner, input.id, i, supportedTests[i].id]);
        guard(isCurrent);
      });
    },
    /** @param {string} owner @param {string} id @param {number} ordinal @param {import('../features/tests/batteryFlow.js').BatteryResult} result @param {boolean} end @param {() => boolean} isCurrent */
    async finish(owner, id, ordinal, result, end, isCurrent) {
      requireOwner(owner); guard(isCurrent);
      if (!Number.isInteger(ordinal) || supportedTests[ordinal]?.id !== result.testId || !result.sessionId || !['completed', 'cancelled'].includes(result.status) || !Number.isInteger(result.elapsedMs) || result.elapsedMs < 0 || result.elapsedMs > 30000 || (result.status === 'completed' && result.elapsedMs !== 30000)) throw new Error(t('Kết quả trong chuỗi không hợp lệ.'));
      const db = await getDatabase(); guard(isCurrent);
      await db.withExclusiveTransactionAsync(async (tx) => {
        guard(isCurrent);
        const root = await tx.getFirstAsync(`${ROOT} WHERE b.owner_id=? AND b.id=? AND b.ended_at='' AND ${ACTIVE}`, [owner, id]);
        if (!root) throw new Error(t('Chuỗi không còn hoạt động hoặc hồ sơ đã thay đổi.'));
        const item = await tx.getFirstAsync('SELECT * FROM battery_items WHERE owner_id=? AND battery_id=? AND ordinal=? AND session_id=?', [owner, id, ordinal, result.sessionId]);
        if (!item || !['active', result.status].includes(item.phase)) throw new Error(t('Kết quả trong chuỗi không hợp lệ.'));
        const saved = await tx.getFirstAsync('SELECT id,status,elapsed_ms FROM test_sessions WHERE owner_id=? AND id=? AND test_id=? AND patient_id IS ?', [owner, result.sessionId, result.testId, root.patient_id]);
        if ((result.saved && !saved) || (saved && (saved.status !== result.status || saved.elapsed_ms !== result.elapsedMs))) throw new Error(t('Lượt đã lưu không khớp kết quả chuỗi. Hãy tải lại.'));
        await tx.runAsync('UPDATE battery_items SET phase=?,elapsed_ms=?,camera_error=? WHERE owner_id=? AND battery_id=? AND ordinal=?', [result.status, result.elapsedMs, result.cameraError ? 1 : 0, owner, id, ordinal]);
        if (end || ordinal === supportedTests.length - 1) await tx.runAsync("UPDATE battery_runs SET ended_at=? WHERE owner_id=? AND id=? AND ended_at=''", [new Date().toISOString(), owner, id]);
        guard(isCurrent);
      });
    },
    /** @param {string} owner @param {string} id @param {() => boolean} isCurrent */
    async end(owner, id, isCurrent) {
      requireOwner(owner); guard(isCurrent); const db = await getDatabase(); guard(isCurrent);
      await db.withExclusiveTransactionAsync(async (tx) => {
        guard(isCurrent);
        const row = await tx.getFirstAsync(`${ROOT} WHERE b.owner_id=? AND b.id=? AND ${ACTIVE}`, [owner, id]);
        if (!row) throw new Error(t('Chuỗi không còn tồn tại hoặc hồ sơ đã thay đổi.'));
        await tx.runAsync("UPDATE battery_runs SET ended_at=? WHERE owner_id=? AND id=? AND ended_at=''", [new Date().toISOString(), owner, id]);
        guard(isCurrent);
      });
    },
    /** @param {string} owner @param {string | null} [patientId] @param {number} [offset] @returns {Promise<BatteryRow[]>} */
    async list(owner, patientId = null, offset = 0) {
      requireOwner(owner); const db = await getDatabase();
      return db.getAllAsync(`SELECT b.*,p.name AS patient_name,p.code AS patient_code,p.birth_date,p.gender,
        (SELECT COUNT(*) FROM battery_items i JOIN test_sessions s ON s.owner_id=i.owner_id AND s.id=i.session_id AND s.test_id=i.test_id AND s.patient_id IS b.patient_id WHERE i.owner_id=b.owner_id AND i.battery_id=b.id) AS saved_count
        FROM battery_runs b LEFT JOIN patients p ON p.owner_id=b.owner_id AND p.id=b.patient_id WHERE b.owner_id=? AND ${ACTIVE} ${patientId ? 'AND b.patient_id=?' : ''} ORDER BY b.created_at DESC,b.id DESC LIMIT 30 OFFSET ?`,
      [owner, ...(patientId ? [patientId] : []), Math.max(0, Math.floor(offset))]);
    },
    /** Read report rows in one transaction so source status and notes share a snapshot.
     * @param {string} owner @param {string} id @returns {Promise<RecordedBattery | null>} */
    async get(owner, id) {
      requireOwner(owner); const db = await getDatabase();
      /** @type {RecordedBattery | null} */ let result = null;
      await db.withExclusiveTransactionAsync(async (tx) => {
        const root = /** @type {BatteryRow | null} */ (await tx.getFirstAsync(`${ROOT} WHERE b.owner_id=? AND b.id=? AND ${ACTIVE}`, [owner, id]));
        if (!root) return;
        const rows = await tx.getAllAsync(`SELECT i.*,s.id AS saved_id,s.status AS saved_status,s.elapsed_ms AS saved_elapsed,s.notes AS saved_notes,s.camera_status AS saved_camera,s.deleted_segments AS saved_segments,
          d.id AS draft_id,d.status AS draft_status,d.elapsed_ms AS draft_elapsed,d.notes AS draft_notes,d.camera_status AS draft_camera,d.deleted_segments AS draft_segments
          FROM battery_items i JOIN battery_runs b ON b.owner_id=i.owner_id AND b.id=i.battery_id
          LEFT JOIN test_sessions s ON s.owner_id=i.owner_id AND s.id=i.session_id AND s.test_id=i.test_id AND s.patient_id IS b.patient_id
          LEFT JOIN pending_runs d ON d.owner_id=i.owner_id AND d.id=i.session_id AND d.test_id=i.test_id AND d.patient_id IS b.patient_id
          WHERE i.owner_id=? AND i.battery_id=? ORDER BY i.ordinal`, [owner, id]);
        if (rows.length !== supportedTests.length || rows.some((row, index) => row.ordinal !== index || row.test_id !== supportedTests[index].id)) throw new Error(t('Danh sách bài trong chuỗi không hợp lệ.'));
        result = { ...root, items: rows.map(resolveBatteryItem) };
      });
      return result;
    },
  };
}
