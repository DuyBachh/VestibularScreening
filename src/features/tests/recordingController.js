import { t } from '../language/language.js';
/** Serialize native recordings and delete every returned segment before allowing another.
 * @param {{ getCamera: () => { recordAsync: (options: object) => Promise<{uri: string} | undefined>, stopRecording: () => void } | null,
 * remove: (uri: string) => void | Promise<void>, onBusy: (busy: boolean) => void, onError: (message: string) => void,
 * onDeleted: () => void }} options */
export function createRecordingController({ getCamera, remove, onBusy, onError, onDeleted }) {
  let wanted = false;
  let disposed = false;
  let busy = false;
  let stopping = false;
  let pending = '';
  /** @type {ReturnType<typeof getCamera>} */
  let recordingCamera = null;

  async function run() {
    if (busy || disposed || !wanted) return;
    const device = getCamera();
    if (!device) return;
    busy = true;
    stopping = false;
    recordingCamera = device;
    onBusy(true);
    try {
      if (pending) { await remove(pending); pending = ''; }
      if (!wanted || disposed) return;
      const video = await device.recordAsync({ maxDuration: 40, maxFileSize: 60 * 1024 * 1024, progressUpdateInterval: 0.25 });
      if (video?.uri) {
        pending = video.uri;
        await remove(pending);
        pending = '';
        if (!disposed) onDeleted();
      } else if (!disposed) throw new Error('Missing video');
      if (wanted && !stopping && !disposed) {
        wanted = false;
        onError(t("Camera đã dừng trước khi bài kết thúc. Bài đã tạm dừng; hãy thử lại."));
      }
    } catch {
      wanted = false;
      if (!disposed) onError(pending ? t("Chưa xóa được video tạm. Hãy dọn video trước khi tiếp tục.") : t("Không hoàn tất được file video camera. Hãy kết thúc lượt và thử lại."));
    } finally {
      busy = false;
      recordingCamera = null;
      if (!disposed) onBusy(false);
      // A resume received during stop waits for deletion, rather than starting twice.
      if (wanted && !disposed) void run();
    }
  }

  function stop() {
    if (!busy || stopping) return;
    stopping = true;
    try { recordingCamera?.stopRecording(); } catch { /* Native unmount/maxDuration also limits recording. */ }
  }

  return {
    /** @param {boolean} active */
    setActive(active) { wanted = active; if (active) void run(); else stop(); },
    dispose() { disposed = true; wanted = false; stop(); },
  };
}
