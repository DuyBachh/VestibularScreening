import { t as translate } from '../language/language.js';
import { escapeReportText } from '../tests/sessionReport.js';
import { traceChartDomain, traceSegments } from './eyeTrace.js';

/** Snapshot translated labels in the caller; keep HTML independent from current locale.
 * @param {{analysis: ReturnType<import('./eyeTrace.js').analyzeEyeTrace>, sample: boolean, generatedAt: Date, language: string, metrics: {label: string, value: string, unit: string}[], method: string}} options */
export function buildTraceReport({ analysis, sample, generatedAt, language, metrics, method }) {
  /** @param {string} source @param {unknown[]} [args] */
  const t = (source, args = []) => translate(source, args, language);
  const e = escapeReportText;
  const domain = traceChartDomain(analysis.samples);
  const x = (/** @type {number} */ time) => 35 + (time - domain.start) / (domain.end - domain.start) * 490;
  const y = (/** @type {number} */ value) => 10 + (domain.max - value) / (domain.max - domain.min) * 180;
  const chart = (['target', 'eye']).map((field) => traceSegments(analysis.samples, /** @type {'eye' | 'target'} */ (field)).map((segment) => `<polyline fill="none" stroke="${field === 'eye' ? '#b45309' : '#164e63'}" stroke-width="1.5" points="${segment.map((point) => `${x(point.time).toFixed(2)},${y(point.value).toFixed(2)}`).join(' ')}"/>`).join('')).join('');
  const quality = analysis.quality;
  return `<!doctype html><html lang="${language === 'en' ? 'en' : 'vi'}"><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#102a43}h1{font-size:22px}h2{font-size:16px;margin-top:22px}table{border-collapse:collapse;width:100%}th,td{padding:8px;border:1px solid #cbd5e1;text-align:left}th{background:#edf3f7}tr{break-inside:avoid}svg{width:100%;height:auto}p{overflow-wrap:anywhere}.chart{break-inside:avoid}
  </style></head><body><h1>${e(t('Phân tích dữ liệu mắt'))}</h1>
  <p><strong>${e(sample ? t('DỮ LIỆU MÔ PHỎNG · DEMO') : t('DỮ LIỆU NHẬP · CHƯA KIỂM CHỨNG NGUỒN ĐO'))}</strong></p>
  <p>${e(t('Chỉ phục vụ nghiên cứu thuật toán. Không dùng để phân loại bình thường/bất thường hoặc chẩn đoán. Ứng dụng chưa theo dõi đồng tử từ camera.'))}</p>
  <p>${e(analysis.mode === 'pursuit' ? 'Smooth Pursuit' : 'Saccades')} · ${e(analysis.algorithm)} · ${e(generatedAt.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', { timeZoneName: 'short' }))}</p>
  <h2>${e(t('Kiểm tra dữ liệu đầu vào'))}</h2>
  <p>${e(t('{0} mẫu · {1} Hz trung vị · {2}% mẫu hợp lệ · khoảng mất mẫu lớn nhất {3} ms', [quality.sampleCount, quality.sampleHz.toFixed(1), (quality.validRatio * 100).toFixed(1), quality.maxGapMs.toFixed(0)]))}</p>
  <p>${e(quality.ready ? t('Đạt điều kiện tính toán của thuật toán, không xác nhận chất lượng tracking lâm sàng.') : t('Dữ liệu không đủ điều kiện tính toán. Chỉ hiển thị đồ thị; không suy ra chỉ số.'))}</p>
  <div class="chart"><h2>${e(t('Đồ thị vị trí theo thời gian'))}</h2><p>${e(t('Xanh đậm: mục tiêu · Cam: mắt · Góc (°)'))}</p>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 220"><rect x="35" y="10" width="490" height="180" fill="#f4f8fb" stroke="#cbd5e1"/>${chart}<text x="0" y="20" font-size="9">${domain.max.toFixed(1)}°</text><text x="0" y="190" font-size="9">${domain.min.toFixed(1)}°</text><text x="35" y="210" font-size="10">0 s</text><text x="485" y="210" font-size="10">${((domain.end - domain.start) / 1000).toFixed(1)} s</text></svg></div>
  <h2>${e(t('Chỉ số tính từ dữ liệu nhập'))}</h2><table>${metrics.map((metric) => `<tr><th>${e(metric.label)}</th><td>${e(metric.value)} ${e(metric.unit)}</td></tr>`).join('')}</table>
  <h2>${e(t('Phương pháp và giới hạn'))}</h2><p>${e(method)}</p>
  <p>${e(t('Chỉ số dùng một trục góc đã được hiệu chỉnh bên ngoài, không đổi pixel thành độ. Không lọc bandpass, không bù chớp mắt, không ước tính SPV hoặc NPC. Vận tốc đỉnh phụ thuộc tần số lấy mẫu; độ trễ có sai số lượng tử theo khoảng mẫu. Dấu — nghĩa là không đủ dữ liệu, không phải kết quả bằng 0.'))}</p>
  <p>${e(t('Biểu đồ rút gọn điểm để hiển thị; tính toán dùng toàn bộ mẫu hợp lệ. Khoảng trống không được nối. Đây là vị trí nhập vào, không phải kết quả camera của ứng dụng.'))}</p>
  </body></html>`;
}
