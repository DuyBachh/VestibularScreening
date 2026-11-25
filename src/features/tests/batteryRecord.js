import { t, getLanguage } from '../language/language.js';

/** @typedef {{ordinal: number, testId: string, sessionId: string | null, status: string, source: string, elapsedMs: number | null, notes: string, cameraStatus: string, deletedSegments: number}} BatteryItem */
/** Merge only matched owner/test/patient joins. A draft never becomes a saved session.
 * @param {Record<string, any>} row @returns {BatteryItem} */
export function resolveBatteryItem(row) {
  const base = { ordinal: row.ordinal, testId: row.test_id, sessionId: row.session_id, deletedSegments: 0 };
  if (row.saved_id) return { ...base, status: row.saved_status, source: 'saved', elapsedMs: row.saved_elapsed, notes: row.saved_notes, cameraStatus: row.saved_camera, deletedSegments: row.saved_segments };
  if (row.draft_id) return { ...base, status: row.draft_status === 'active' ? 'interrupted' : row.draft_status, source: 'draft', elapsedMs: row.draft_elapsed, notes: row.draft_notes, cameraStatus: row.draft_camera, deletedSegments: row.draft_segments };
  if (['completed', 'cancelled'].includes(row.phase)) return { ...base, status: row.phase, source: 'discarded', elapsedMs: row.elapsed_ms, notes: '', cameraStatus: row.camera_error ? 'error' : 'unknown' };
  return { ...base, status: row.phase === 'active' ? 'interrupted' : 'not_performed', source: row.phase === 'active' ? 'missing' : 'none', elapsedMs: null, notes: '', cameraStatus: 'unknown' };
}
/** @param {BatteryItem[]} items */
export function recordedBatteryCounts(items) {
  return { completed: items.filter((item) => item.status === 'completed').length, cancelled: items.filter((item) => item.status === 'cancelled').length,
    interrupted: items.filter((item) => item.status === 'interrupted').length, remaining: items.filter((item) => item.status === 'not_performed').length,
    saved: items.filter((item) => item.source === 'saved').length };
}
/** @param {string} value @param {string} [language] */
export function batteryItemStatus(value, language = getLanguage()) {
  return value === 'completed' ? t('Hoàn tất', [], language) : value === 'cancelled' ? t('Đã hủy', [], language) : value === 'interrupted' ? t('Gián đoạn · Chưa xác nhận kết quả', [], language) : t('Chưa thực hiện', [], language);
}
/** @param {string} value @param {string} [language] */
export function batteryItemSource(value, language = getLanguage()) {
  return value === 'saved' ? t('Đã lưu vào lịch sử', [], language) : value === 'draft' ? t('Còn bản nháp · Chưa lưu lịch sử', [], language) : value === 'discarded' ? t('Không lưu lượt · Không giữ ghi chú', [], language) : value === 'missing' ? t('Không còn bản nháp hoặc kết quả đã lưu', [], language) : t('Không có lượt chạy', [], language);
}
