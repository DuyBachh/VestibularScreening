import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useEffect, useRef } from 'react';
import { CameraView } from 'expo-camera';
import { StyleSheet, Text, View } from 'react-native';
import { deleteTrialVideo } from '../../services/cameraTrialFiles';
import { createRecordingController } from './recordingController';
import { colors } from '../../constants/theme';

/** @param {{ active: boolean, confirmed: boolean, visible: boolean, onReady: (ready: boolean) => void, onProgress: () => void,
 * onBusy: (busy: boolean) => void, onError: (message: string) => void, onDeleted: () => void,
 * phase?: string, deletedSegments?: number, show?: boolean }} props */
export function RunCamera({ active, confirmed, visible, onReady, onProgress, onBusy, onError, onDeleted, phase = 'stopped', deletedSegments = 0, show = true }) {
  useLanguage();
  /** @type {import('react').RefObject<CameraView | null>} */
  const camera = useRef(null);
  /** @type {import('react').RefObject<ReturnType<typeof createRecordingController> | null>} */
  const controller = useRef(null);
  useEffect(() => {
    const instance = createRecordingController({ getCamera: () => camera.current, remove: deleteTrialVideo, onBusy, onError, onDeleted });
    controller.current = instance;
    return () => { instance.dispose(); controller.current = null; };
  }, [onBusy, onError, onDeleted]);
  useEffect(() => {
    const instance = controller.current;
    instance?.setActive(active && visible);
    return () => instance?.setActive(false);
  }, [active, visible]);
  const recording = confirmed && phase === 'recording';
  const title = phase === 'error' ? t("Camera gặp sự cố") : phase === 'stopping' ? t("Đang dừng và xóa video…") : recording ? t("Camera đang ghi") : phase === 'starting' ? t("Đang bắt đầu ghi…") : phase === 'opening' ? t("Đang mở camera…") : phase === 'ready' ? t("Camera sẵn sàng") : t("Camera đã dừng ghi");
  return <View style={[styles.row, !show && styles.hidden]}>
    {visible ? <View style={styles.preview}><CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" mode="video" videoQuality="480p" mute
      onCameraReady={() => onReady(true)} onMountError={() => { onReady(false); onError(t("Không mở được camera. Hãy kết thúc lượt và kiểm tra lại quyền camera.")); }}
      onRecordingProgress={onProgress} /></View> : null}
    <View style={styles.copy}><View style={styles.titleRow}>{recording ? <View style={styles.recordDot} /> : null}<Text style={[styles.title, phase === 'error' && styles.error]}>{title}</Text></View><Text style={styles.text}>{t("Không thu âm")}</Text><Text style={styles.text}>{phase === 'stopped' ? deletedSegments > 0 ? t("Đã xóa {0} đoạn video tạm", [deletedSegments]) : t("Chưa có đoạn ghi được xác nhận") : phase === 'ready' || phase === 'opening' ? t("Chưa bắt đầu ghi") : t("Video tạm xóa khi dừng đoạn quay")}</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1, borderColor: '#DCE4EB', borderRadius: 14, backgroundColor: '#FFFFFF' }, hidden: { display: 'none' },
  preview: { width: 44, height: 56, borderRadius: 9, overflow: 'hidden', backgroundColor: colors.text }, copy: { flex: 1, gap: 2 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, title: { flex: 1, color: colors.primary, fontSize: 13, lineHeight: 20, fontWeight: '600' }, recordDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B42332' },
  text: { color: colors.muted, fontSize: 11, lineHeight: 18 }, error: { color: colors.danger },
});
