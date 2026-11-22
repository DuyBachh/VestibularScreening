import { t } from '../language/language.js';
import { isSupportedTest } from './catalog.js';

export const SESSION_SCHEMA = `
  CREATE UNIQUE INDEX IF NOT EXISTS patients_owner_id ON patients(owner_id, id);
  CREATE TABLE IF NOT EXISTS test_sessions (
    id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, patient_id TEXT,
    test_id TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL CHECK(elapsed_ms BETWEEN 0 AND 30000),
    status TEXT NOT NULL CHECK(status IN ('completed', 'cancelled')),
    camera_status TEXT NOT NULL CHECK(camera_status IN ('not_used', 'deleted', 'error')),
    deleted_segments INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '',
    FOREIGN KEY(owner_id, patient_id) REFERENCES patients(owner_id, id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS sessions_owner_date ON test_sessions(owner_id, ended_at DESC);
  CREATE INDEX IF NOT EXISTS sessions_patient_date ON test_sessions(owner_id, patient_id, ended_at DESC);
`;

/** @typedef {{ id: string, patientId: string | null, testId: string, startedAt: string, endedAt: string,
 * elapsedMs: number, status: string, cameraStatus: string, deletedSegments: number }} SessionDraft */
/** @param {SessionDraft} draft @param {string} notes */
export function validateSession(draft, notes) {
  if (!draft.id || !isSupportedTest(draft.testId)) throw new Error(t("Phiên không hợp lệ."));
  if (!['completed', 'cancelled'].includes(draft.status)) throw new Error(t("Phiên chưa kết thúc."));
  if (!Number.isInteger(draft.elapsedMs) || draft.elapsedMs < 0 || draft.elapsedMs > 30000) throw new Error(t("Thời lượng không hợp lệ."));
  if (draft.status === 'completed' && draft.elapsedMs !== 30000) throw new Error(t("Bài chưa chạy đủ thời lượng."));
  const start = Date.parse(draft.startedAt), end = Date.parse(draft.endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start + 1000 < draft.elapsedMs) throw new Error(t("Thời gian phiên không hợp lệ."));
  if (!['not_used', 'deleted', 'error'].includes(draft.cameraStatus) || !Number.isInteger(draft.deletedSegments) || draft.deletedSegments < 0) throw new Error(t("Trạng thái camera không hợp lệ."));
  if (draft.cameraStatus === 'not_used' && draft.deletedSegments !== 0) throw new Error(t("Dữ liệu camera không nhất quán."));
  if (draft.cameraStatus === 'deleted' && draft.elapsedMs > 0 && draft.deletedSegments === 0) throw new Error(t("Chưa xác nhận xóa video."));
  if (typeof notes !== 'string' || notes.trim().length > 1000) throw new Error(t("Ghi chú tối đa 1.000 ký tự."));
}

export function makeSessionId() { return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`; }
