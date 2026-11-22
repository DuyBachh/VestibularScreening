import { t } from '../language/language.js';
/** @param {{status: string, withCamera: boolean, cameraBusy: boolean, cameraError: string, foreground: boolean}} input */
export function runPresentation({ status, withCamera, cameraBusy, cameraError, foreground }) {
  const terminal = status === 'completed' || status === 'cancelled';
  const processing = withCamera && cameraBusy && (terminal || status === 'paused');
  const failure = !!cameraError;
  const cameraPhase = failure ? 'error' : processing ? 'stopping' : status === 'running' ? 'recording' : status === 'arming' ? 'starting' : status === 'preparing' ? 'opening' : status === 'countdown' ? 'ready' : 'stopped';
  return {
    terminal, processing, cameraPhase,
    showResult: terminal && !cameraBusy,
    showError: status === 'paused' && failure && !processing,
    canResume: status === 'paused' && !cameraBusy && !failure && foreground,
    canEnd: !terminal && status !== 'ready' && !processing,
    title: processing ? t("Đang xử lý video") : failure && status === 'paused' ? t("Camera gặp sự cố") : status === 'paused' ? t("Đã tạm dừng") : status === 'countdown' ? t("Chuẩn bị") : status === 'preparing' ? t("Đang mở camera") : status === 'arming' ? t("Đang bắt đầu ghi") : t("Đang thực hiện"),
  };
}
/** @param {number} seconds */
export function runClock(seconds) { return `00:${String(Math.min(30, Math.max(0, Math.ceil(Number.isFinite(seconds) ? seconds : 30)))).padStart(2, '0')}`; }
