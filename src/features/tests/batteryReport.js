import { t as translate, genderLabel } from '../language/language.js';
import { normalizeReportBranding } from '../auth/reportBranding.js';
import { escapeReportText as e } from './sessionReport.js';
import { batteryItemSource, batteryItemStatus, recordedBatteryCounts } from './batteryRecord.js';
import { supportedTests } from './catalog.js';

/** @param {import('../../services/batteryRepository.js').RecordedBattery} battery
 * @param {import('../auth/reportBranding.js').ReportBranding} [branding] @param {string} [language] @param {Date} [generatedAt] */
export function buildBatteryReport(battery, branding = {}, language = 'vi', generatedAt = new Date()) {
  /** @param {string} source @param {unknown[]} [args] */
  const t = (source, args = []) => translate(source, args, language);
  const reporter = normalizeReportBranding(branding);
  const counts = recordedBatteryCounts(battery.items);
  const date = (/** @type {string} */ value) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { timeZoneName: 'short' }) : t('Chưa xác nhận kết thúc chuỗi');
  const row = (/** @type {string} */ label, /** @type {unknown} */ value) => `<tr><th>${e(label)}</th><td>${e(value)}</td></tr>`;
  const items = battery.items.map((item, index) => {
    const name = supportedTests.find((test) => test.id === item.testId)?.name || item.testId;
    const camera = item.cameraStatus === 'not_used' ? t('Không sử dụng') : item.cameraStatus === 'deleted' ? t('Đã xóa {0} đoạn video tạm', [item.deletedSegments]) : item.cameraStatus === 'error' ? t('Có lỗi camera') : t('Chưa có xác nhận camera');
    return `<section><h2>${index + 1}. ${e(name)}</h2><table>${row(t('Trạng thái'), batteryItemStatus(item.status, language))}${row(t('Nguồn thông tin lượt'), batteryItemSource(item.source, language))}${row(t('Thời gian thực hiện'), item.elapsedMs === null ? '—' : `${(item.elapsedMs / 1000).toFixed(1)} s`)}${item.status === 'not_performed' ? '' : row('Camera', camera)}</table>
      ${item.status === 'interrupted' ? `<p>${e(t('Thời lượng của lượt gián đoạn là mốc cuối đã ghi, không phải thời gian hoàn tất.'))}</p>` : ''}
      <h3>${e(item.source === 'draft' ? t('Ghi chú từ bản nháp chưa lưu') : t('Ghi chú'))}</h3><div class="notes">${e(item.source === 'discarded' || item.source === 'missing' ? t('Ghi chú đã bỏ không được giữ trong tổng hợp.') : item.notes || t('Không có ghi chú.'))}</div></section>`;
  }).join('');
  return `<!doctype html><html lang="${language === 'en' ? 'en' : 'vi'}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><title>${e(t('Báo cáo tổng hợp chuỗi 6 bài'))}</title><style>
    @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:11pt/1.5 Arial,sans-serif;color:#102a43;margin:0}h1{font-size:22pt;line-height:1.25}h2{font-size:14pt;margin-top:22px;break-after:avoid}h3{font-size:11pt;break-after:avoid}.logo{max-width:140px;height:60px;object-fit:contain}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{width:35%;background:#f1f5f9;font-weight:normal}tr{break-inside:avoid}.notes{white-space:pre-wrap;overflow-wrap:anywhere;word-wrap:break-word;padding:10px;border:1px solid #cbd5e1}p,.footer{overflow-wrap:anywhere}.footer{font-size:9pt;border-top:1px solid #cbd5e1;margin-top:24px;padding-top:10px}
    </style></head><body>${reporter.logoData ? `<img class="logo" alt="${e(t('Logo cơ sở'))}" src="${reporter.logoData}">` : ''}
    <p>VESTIBULAR SCREENING</p><h1>${e(t('Báo cáo tổng hợp chuỗi 6 bài'))}</h1><p><strong>${e(t('MÔ PHỎNG HỌC TẬP - KHÔNG DÙNG CHẨN ĐOÁN'))}</strong></p>
    <p>${e(t('Báo cáo tổng hợp metadata và ghi chú của chuỗi đã ghi trên thiết bị. Không có chỉ số mắt, video hoặc kết luận lâm sàng.'))}</p>
    <h2>${e(t('Hồ sơ và chuỗi'))}</h2><table>${row(t('Họ và tên'), battery.patient_name || t('Không gắn hồ sơ'))}${row(t('Mã bệnh nhân'), battery.patient_code || t('Không áp dụng'))}${battery.patient_id ? row(t('Ngày sinh'), battery.birth_date ? battery.birth_date.split('-').reverse().join('/') : t('Chưa cung cấp')) + row(t('Giới tính'), battery.gender ? genderLabel(battery.gender, language) : t('Chưa cung cấp')) : ''}${row(t('Mã chuỗi'), battery.id)}${row(t('Bắt đầu phiên'), date(battery.created_at))}${row(t('Kết thúc phiên'), date(battery.ended_at))}</table>
    <p>${e(t('{0} hoàn tất · {1} đã hủy · {2} gián đoạn · {3} chưa thực hiện', [counts.completed, counts.cancelled, counts.interrupted, counts.remaining]))}<br>${e(t('{0}/6 lượt đã lưu vào lịch sử', [counts.saved]))}</p>
    <p>${e(t('Lượt còn bản nháp được ghi rõ là chưa lưu lịch sử. Khi bỏ lượt hoặc xóa bản nháp, tổng hợp chỉ giữ trạng thái/thời lượng đã xác nhận, không giữ lại ghi chú đã bỏ.'))}</p>
    ${items}<h2>${e(t('Người lập báo cáo'))}</h2><table>${row(t('Họ và tên'), reporter.fullName || t('Chưa cung cấp'))}${row(t('Chuyên khoa'), reporter.specialty || t('Chưa cung cấp'))}${row(t('Cơ sở làm việc'), reporter.workplace || t('Chưa cung cấp'))}</table>
    <div class="footer">${e(t('Tạo báo cáo:'))} ${e(date(generatedAt.toISOString()))}<br>${e(t('Hồ sơ, ghi chú và thông tin người lập được đọc theo dữ liệu hiện tại. Bản PDF đã xuất trước đó không tự thay đổi.'))}</div></body></html>`;
}
