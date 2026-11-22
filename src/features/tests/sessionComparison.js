import { t } from '../language/language.js';
/** @typedef {import('../../services/sessionRepository').SessionRecord} SessionRecord */

/** @param {SessionRecord} first @param {SessionRecord} second */
export function compareSessionMetadata(first, second) {
  if (first.id === second.id) throw new Error(t("Hãy chọn hai lượt kiểm tra khác nhau."));
  if (!first.patient_id || !second.patient_id) throw new Error(t("Chỉ so sánh các lượt đã gắn hồ sơ bệnh nhân."));
  if (first.patient_id !== second.patient_id) throw new Error(t("Hai lượt phải thuộc cùng một bệnh nhân."));
  if (first.test_id !== second.test_id) throw new Error(t("Hai lượt phải là cùng một bài kiểm tra."));
  const firstTime = Date.parse(first.ended_at), secondTime = Date.parse(second.ended_at);
  if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) throw new Error(t("Thời gian phiên không hợp lệ."));
  const ordered = firstTime < secondTime || (firstTime === secondTime && first.id.localeCompare(second.id) < 0);
  const earlier = ordered ? first : second;
  const later = ordered ? second : first;
  return { earlier, later, deltaMs: later.elapsed_ms - earlier.elapsed_ms };
}

/** @param {(owner: string, id: string) => Promise<SessionRecord | null>} get
 * @param {string} owner @param {string} firstId @param {string} secondId */
export async function loadSessionComparison(get, owner, firstId, secondId) {
  if (!owner?.trim()) throw new Error(t("Cần đăng nhập để so sánh."));
  if (!firstId || !secondId || firstId === secondId) throw new Error(t("Hãy chọn hai lượt kiểm tra khác nhau."));
  const [first, second] = await Promise.all([get(owner, firstId), get(owner, secondId)]);
  if (!first || !second) throw new Error(t("Một trong hai phiên không tồn tại, đã bị xóa hoặc không thuộc tài khoản này."));
  return compareSessionMetadata(first, second);
}
