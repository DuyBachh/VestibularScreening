import { t } from '../features/language/language.js';

export const ACTIVITY_TABLE_SCHEMA = `CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK(event IN ('patient_created','patient_updated','patient_trashed','patient_restored','patient_deleted','session_saved','session_notes_updated','pdf_preview_requested','pdf_created','pdf_share_requested')),
  category TEXT NOT NULL CHECK(category IN ('patient','session','report')),
  target_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_owner_id ON activity_events(owner_id, id DESC);`;

// Triggers share the mutation's SQLite statement: a failed write cannot leave a success log.
// No names, notes, birth dates, credentials, URIs or report contents are copied.
const stamp = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
export const ACTIVITY_SCHEMA = `${ACTIVITY_TABLE_SCHEMA}
CREATE TRIGGER IF NOT EXISTS activity_patient_create AFTER INSERT ON patients BEGIN
  INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES(NEW.owner_id,'patient_created','patient',NEW.id,${stamp});
END;
CREATE TRIGGER IF NOT EXISTS activity_patient_update AFTER UPDATE ON patients
WHEN OLD.deleted_at IS NEW.deleted_at AND (OLD.code IS NOT NEW.code OR OLD.name IS NOT NEW.name OR OLD.birth_date IS NOT NEW.birth_date OR OLD.gender IS NOT NEW.gender OR OLD.notes IS NOT NEW.notes) BEGIN
  INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES(NEW.owner_id,'patient_updated','patient',NEW.id,${stamp});
END;
CREATE TRIGGER IF NOT EXISTS activity_patient_trash AFTER UPDATE ON patients WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL BEGIN
  INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES(NEW.owner_id,'patient_trashed','patient',NEW.id,${stamp});
END;
CREATE TRIGGER IF NOT EXISTS activity_patient_restore AFTER UPDATE ON patients WHEN OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL BEGIN
  INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES(NEW.owner_id,'patient_restored','patient',NEW.id,${stamp});
END;
CREATE TRIGGER IF NOT EXISTS activity_patient_delete AFTER DELETE ON patients BEGIN
  INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES(OLD.owner_id,'patient_deleted','patient',OLD.id,${stamp});
END;
CREATE TRIGGER IF NOT EXISTS activity_session_save AFTER INSERT ON test_sessions BEGIN
  INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES(NEW.owner_id,'session_saved','session',NEW.id,${stamp});
END;
CREATE TRIGGER IF NOT EXISTS activity_session_notes AFTER UPDATE OF notes ON test_sessions WHEN OLD.notes IS NOT NEW.notes BEGIN
  INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at) VALUES(NEW.owner_id,'session_notes_updated','session',NEW.id,${stamp});
END;`;

/** @typedef {{id: number, owner_id: string, event: string, category: string, target_id: string, occurred_at: string}} ActivityEvent */
/** @param {string} owner */
function requireOwner(owner) {
  if (typeof owner !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(owner)) throw new Error(t('Cần đăng nhập để xem nhật ký.'));
  return owner;
}
const REPORT_EVENTS = ['pdf_preview_requested', 'pdf_created', 'pdf_share_requested'];
/** @param {() => Promise<import('expo-sqlite').SQLiteDatabase>} getDatabase @param {() => Date} now */
export function createActivityRepository(getDatabase, now = () => new Date()) {
  return {
    /** @param {string} owner @param {{category?: string, beforeId?: number, limit?: number}} options @returns {Promise<ActivityEvent[]>} */
    async list(owner, { category = 'all', beforeId, limit = 30 } = {}) {
      requireOwner(owner);
      if (!['all', 'patient', 'session', 'report'].includes(category) || (beforeId !== undefined && (!Number.isSafeInteger(beforeId) || beforeId <= 0))) throw new Error(t('Bộ lọc nhật ký không hợp lệ.'));
      const size = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 30;
      const db = await getDatabase();
      return db.getAllAsync(`SELECT id,owner_id,event,category,target_id,occurred_at FROM activity_events WHERE owner_id = ?
        ${category === 'all' ? '' : 'AND category = ?'} ${beforeId === undefined ? '' : 'AND id < ?'} ORDER BY id DESC LIMIT ?`,
      [owner, ...(category === 'all' ? [] : [category]), ...(beforeId === undefined ? [] : [beforeId]), size]);
    },
    /** Native report events describe requests or verified file creation, never delivery.
     * @param {string} owner @param {string} event @param {string} sessionId */
    async appendReport(owner, event, sessionId) {
      requireOwner(owner);
      if (!REPORT_EVENTS.includes(event) || typeof sessionId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(sessionId)) throw new Error(t('Thông tin nhật ký không hợp lệ.'));
      const db = await getDatabase();
      // Bind ownership and active-record checks to the insert, including unlinked sessions.
      const result = await db.runAsync(`INSERT INTO activity_events(owner_id,event,category,target_id,occurred_at)
        SELECT ?,?,'report',?,? WHERE EXISTS (SELECT 1 FROM test_sessions s LEFT JOIN patients p ON p.id=s.patient_id AND p.owner_id=s.owner_id
        WHERE s.id=? AND s.owner_id=? AND (s.patient_id IS NULL OR (p.id IS NOT NULL AND p.deleted_at IS NULL)))`,
      [owner, event, sessionId, now().toISOString(), sessionId, owner]);
      if (!result.changes) throw new Error(t('Phiên không còn khả dụng để ghi nhật ký.'));
    },
  };
}
