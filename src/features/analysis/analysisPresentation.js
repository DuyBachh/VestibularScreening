import { t } from '../language/language.js';
import { TraceInputError } from './eyeTrace.js';

/** @param {number | null} value @param {number} [digits] */
export function traceNumber(value, digits = 2) { return value === null || !Number.isFinite(value) ? '—' : value.toFixed(digits); }
/** @param {ReturnType<import('./eyeTrace.js').analyzeEyeTrace>} result */
export function traceMetricRows(result) {
  return [
    { label: t('Sai số vị trí RMS'), value: traceNumber(result.rmseDeg), unit: '°' },
    ...(result.mode === 'pursuit' ? [
      { label: t('Gain vận tốc ước tính'), value: traceNumber(result.pursuitGain), unit: '' },
      { label: t('Thời gian dùng tính gain'), value: traceNumber(result.gainDurationMs / 1000), unit: 's' },
    ] : [
      { label: t('Độ trễ trung bình'), value: traceNumber(result.latencyMs, 0), unit: 'ms' },
      { label: t('Vận tốc đỉnh trung bình'), value: traceNumber(result.peakVelocity, 1), unit: '°/s' },
      { label: t('Gain biên độ trung bình'), value: traceNumber(result.displacementGain), unit: '' },
      { label: t('Đáp ứng được tính'), value: `${result.acceptedCount}/${result.events.length}`, unit: '' },
    ]),
  ];
}
/** @param {unknown} error */
export function traceErrorMessage(error) {
  if (!(error instanceof TraceInputError)) return t('Không phân tích được dữ liệu. Hãy kiểm tra lại nội dung CSV.');
  switch (error.code) {
    case 'header': return t('Dòng đầu phải là time_ms,eye_deg,target_deg,valid.');
    case 'size': return t('CSV quá dài. Giới hạn 240.000 ký tự và 6.000 mẫu.');
    case 'count': return t('CSV cần từ 20 đến 6.000 mẫu, mỗi dòng một mẫu.');
    case 'time': return t('Dòng {0}: thời gian phải tăng dần, không được trùng.', [error.row]);
    case 'row': return t('Dòng {0}: cần 4 cột số; valid là 0 hoặc 1, góc trong ±180°. Mẫu valid=1 không được thiếu eye_deg.', [error.row]);
    case 'duration': return t('Dữ liệu cần kéo dài từ 1 đến 120 giây.');
    default: return t('Không phân tích được dữ liệu. Hãy kiểm tra lại nội dung CSV.');
  }
}
/** @param {string} reason */
export function traceEventReason(reason) {
  switch (reason) {
    case 'baseline': return t('Thiếu đoạn nhìn ổn định trước mục tiêu');
    case 'missing': return t('Mất mẫu trong cửa sổ đáp ứng');
    case 'direction': return t('Chuyển động ban đầu ngược hướng');
    case 'incomplete': return t('Chưa xác định được kết thúc chuyển động');
    case 'target': return t('Mục tiêu không phải chuỗi bước nhảy rời rạc');
    default: return t('Không có đáp ứng đủ điều kiện');
  }
}

export function traceMethodDescription() {
  return t('Thuật toán nghiên cứu v1: vận tốc là sai phân góc/thời gian. Gain vận tốc dùng hồi quy qua gốc, bỏ khoảng mục tiêu dưới 0,5 hoặc trên 40°/s và chuyển động mắt trên 50°/s kèm khoảng lân cận; cần ít nhất 0,5 giây sử dụng được. Saccade: bước mục tiêu ≥2°, nền ổn định ≥50 ms dưới 10°/s, hai khoảng liên tiếp cùng hướng ≥30°/s, kết thúc dưới 15°/s, cửa sổ tối đa 1 giây. Ngưỡng là lựa chọn thuật toán, không phải ngưỡng bệnh lý.');
}
