import { t } from '../language/language.js';

/** @type {Record<string, string>} */
const labels = {
  patient_created: 'Tạo hồ sơ', patient_updated: 'Cập nhật hồ sơ', patient_trashed: 'Chuyển hồ sơ vào thùng rác',
  patient_restored: 'Khôi phục hồ sơ', patient_deleted: 'Xóa vĩnh viễn hồ sơ', session_saved: 'Lưu lượt kiểm tra', session_notes_updated: 'Cập nhật ghi chú phiên',
  pdf_preview_requested: 'Yêu cầu xem/in PDF', pdf_created: 'Đã tạo tệp PDF', pdf_share_requested: 'Yêu cầu chia sẻ PDF',
};
/** @param {string} event */
export function activityLabel(event) { return t(labels[event] || 'Hoạt động'); }
