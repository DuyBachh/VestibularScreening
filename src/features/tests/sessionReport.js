import { t as translate, genderLabel } from '../language/language.js';
import { testCatalog } from './catalog.js';
import { normalizeReportBranding } from '../auth/reportBranding.js';

/** @param {unknown} value */
export function escapeReportText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

/** @param {unknown} error */
export function isPrintCancellation(error) {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  return ['ERR_PRINT_INCOMPLETE', 'ERR_PICKER_CANCELED'].includes(code) || message === 'Printing did not complete';
}
/** @param {string} value @param {string} language */
function dateTime(value, language) {
  /** @param {string} source */
  const t = (source) => translate(source, [], language);
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { timeZoneName: 'short' }) : t("Không có thông tin");
}
/** @param {string} label @param {unknown} value */
function row(label, value) { return `<tr><th>${escapeReportText(label)}</th><td>${escapeReportText(value)}</td></tr>`; }

/** @param {import('../../services/sessionRepository').SessionRecord} session
 * @param {import('../../services/patientDatabase').PatientRecord | null} patient
 * @param {Date} generatedAt
 * @param {import('../auth/reportBranding.js').ReportBranding} branding
 * @param {string} language */
export function buildSessionReport(session, patient = null, generatedAt = new Date(), branding = {}, language = 'vi') {
  /** @param {string} source @param {unknown[]} [args] */
  const t = (source, args = []) => translate(source, args, language);
  const reporter = normalizeReportBranding(branding);
  const name = testCatalog.find((test) => test.id === session.test_id)?.name || session.test_id;
  const camera = session.camera_status === 'not_used' ? t("Không ghi video trong lượt này.")
    : session.camera_status === 'error' ? t("Có lỗi ghi hoặc xóa camera. Không xác nhận ghi hình thành công.")
      : t("Đã ghi và xóa {0} đoạn video tạm.", [session.deleted_segments]);
  const birth = patient?.birth_date ? patient.birth_date.split('-').reverse().join('/') : t("Chưa cung cấp");
  return `<!DOCTYPE html><html lang="${language === 'en' ? 'en' : 'vi'}"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
  <title>${escapeReportText(t("Báo cáo lượt kiểm tra mô phỏng"))}</title><style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; } body { margin: 0; color: #102A43; font: 11pt/1.5 Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .brand { color: #164E63; font-size: 9pt; font-weight: bold; letter-spacing: 1px; }
  .logo { display: block; max-width: 140px; height: 64px; object-fit: contain; object-position: left; margin-bottom: 12px; }
  h1 { font-size: 23pt; line-height: 1.2; margin: 8px 0 12px; } h2 { font-size: 13pt; color: #164E63; margin: 20px 0 8px; break-after: avoid; }
  .notice { background: #E6F0F5; border-left: 4px solid #164E63; padding: 12px; margin: 12px 0 18px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; } th, td { padding: 8px 10px; border-bottom: 1px solid #CFD9E3; text-align: left; vertical-align: top; overflow-wrap: anywhere; word-wrap: break-word; }
  th { width: 32%; font-weight: normal; color: #334E68; } tr { break-inside: avoid; }
  .notes { white-space: pre-wrap; overflow-wrap: anywhere; word-wrap: break-word; border: 1px solid #CFD9E3; border-radius: 8px; padding: 12px; }
  .footer { margin-top: 24px; border-top: 1px solid #829AB1; padding-top: 10px; font-size: 9pt; color: #334E68; overflow-wrap: anywhere; }
  </style></head><body>
  ${reporter.logoData ? `<img class="logo" alt="${escapeReportText(t('Logo cơ sở'))}" src="${reporter.logoData}">` : ''}
  <div class="brand">VESTIBULAR SCREENING</div><h1>${escapeReportText(t("Báo cáo lượt kiểm tra"))}</h1>
  <div class="notice"><strong>${escapeReportText(t("MÔ PHỎNG HỌC TẬP - KHÔNG DÙNG CHẨN ĐOÁN"))}</strong><br>${escapeReportText(t("Thông tin lượt chạy thực tế của nguyên mẫu. Không có đo lường chuyển động mắt hoặc kết luận bình thường/bất thường."))}</div>
  <h2>${escapeReportText(t("1. Hồ sơ bệnh nhân"))}</h2><table>
  ${row(t("Họ và tên"), session.patient_id ? session.patient_name || t("Không có thông tin") : t("Không gắn hồ sơ"))}
  ${row(t("Mã bệnh nhân"), session.patient_code || t("Không áp dụng"))}
  ${session.patient_id ? row(t("Ngày sinh"), birth) + row(t("Giới tính"), patient?.gender ? genderLabel(patient.gender, language) : t("Chưa cung cấp")) : ''}
  </table><h2>${escapeReportText(t("2. Thông tin lượt chạy"))}</h2><table>
  ${row(t("Bài kiểm tra"), name)}${row(t("Trạng thái"), session.status === 'completed' ? t("Hoàn tất bài mô phỏng") : t("Đã hủy"))}
  ${row(t("Thời gian thực hiện"), t("{0} giây (không tính chuẩn bị/tạm dừng)", [Math.round(session.elapsed_ms / 1000)]))}
  ${row(t("Bắt đầu phiên"), dateTime(session.started_at, language))}${row(t("Kết thúc phiên"), dateTime(session.ended_at, language))}
  ${row('Camera', camera)}
  </table><h2>${escapeReportText(t("3. Ghi chú đã lưu"))}</h2><div class="notes">${escapeReportText(session.notes || t("Không có ghi chú."))}</div>
  <h2>${escapeReportText(t("4. Người lập báo cáo"))}</h2><table>${row(t("Họ và tên"), reporter.fullName || t("Chưa cung cấp"))}${row(t("Chuyên khoa"), reporter.specialty || t("Chưa cung cấp"))}${row(t("Cơ sở làm việc"), reporter.workplace || t("Chưa cung cấp"))}</table>
  <div class="footer">${escapeReportText(t("Mã phiên:"))} ${escapeReportText(session.id)}<br>${escapeReportText(t("Tạo báo cáo:"))} ${escapeReportText(dateTime(generatedAt.toISOString(), language))}<br>
  ${escapeReportText(t("Hồ sơ và thông tin người lập hiển thị theo thông tin đã lưu hiện tại. Báo cáo không chứa video, trace đồng tử hoặc chỉ số mắt. Chỉ sử dụng dữ liệu bệnh nhân giả lập cho đồ án."))}</div>
  </body></html>`;
}
