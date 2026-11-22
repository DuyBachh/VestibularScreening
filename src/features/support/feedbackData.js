import { t } from '../language/language.js';
export const FEEDBACK_LIMITS = { title: 100, description: 1200, steps: 1500, expected: 600 };
/** @typedef {{kind: string, title: string, description: string, steps: string, expected: string}} FeedbackDraft */
/** @typedef {{appVersion?: string, platform?: string, osVersion?: string | number}} FeedbackEnvironment */
/** @param {unknown} value */
function clean(value) {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim() : '';
}
/** @param {FeedbackDraft} draft @returns {Record<string, string>} */
export function feedbackErrors(draft) {
  /** @type {Record<string, string>} */
  const errors = {};
  if (!['bug', 'suggestion'].includes(draft.kind)) errors.kind = t("Hãy chọn Báo lỗi hoặc Góp ý.");
  if (!clean(draft.title)) errors.title = t("Vui lòng nhập tiêu đề ngắn gọn.");
  if (!clean(draft.description)) errors.description = t("Vui lòng mô tả nội dung phản hồi.");
  if (draft.kind === 'bug' && !clean(draft.steps)) errors.steps = t("Vui lòng ghi các bước dẫn đến lỗi.");
  for (const field of /** @type {(keyof typeof FEEDBACK_LIMITS)[]} */ (Object.keys(FEEDBACK_LIMITS))) {
    const limit = FEEDBACK_LIMITS[field];
    if (typeof draft[field] !== 'string' || draft[field].length > limit) errors[field] = t("Nội dung vượt giới hạn {0} ký tự hoặc không hợp lệ.", [limit]);
  }
  return errors;
}
/** @param {FeedbackDraft} draft @param {FeedbackEnvironment | null} environment */
export function buildFeedbackMessage(draft, environment = null) {
  const errors = feedbackErrors(draft);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const title = clean(draft.title).replace(/\s+/g, ' ');
  const lines = [`VESTIBULAR SCREENING · ${draft.kind === 'bug' ? t("BÁO LỖI") : t("GÓP Ý")}`, title,
    '', t("Nội dung:"), clean(draft.description)];
  if (clean(draft.steps)) lines.push('', t("Các bước thực hiện:"), clean(draft.steps));
  if (clean(draft.expected)) lines.push('', t("Kết quả mong đợi / đề xuất:"), clean(draft.expected));
  if (environment) {
    const short = /** @param {unknown} value */ (value) => clean(typeof value === 'number' ? String(value) : value).replace(/\s+/g, ' ').slice(0, 40) || t("Chưa xác định");
    const platform = { ios: 'iOS', android: 'Android', web: 'Web' }[environment.platform || ''] || t("Khác");
    lines.push('', t("Thông tin ứng dụng:"), t("Phiên bản: {0}", [short(environment.appVersion)]), t("Hệ điều hành: {0} {1}", [platform, short(environment.osVersion)]));
  }
  lines.push('', t("Phản hồi được người dùng xem lại và chia sẻ thủ công từ nguyên mẫu học tập."));
  return lines.join('\n');
}
