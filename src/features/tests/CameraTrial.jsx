import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';
import { cleanPendingTrialVideo, deleteTrialVideo } from '../../services/cameraTrialFiles';

/** @param {{ onClose: () => void }} props */
export function CameraTrial({ onClose }) {
  useLanguage();
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState(t("Đặt khuôn mặt trong khung hình và kiểm tra ánh sáng."));
  const [error, setError] = useState('');
  const [cameraKey, setCameraKey] = useState(0);
  /** @type {import('react').RefObject<CameraView | null>} */
  const camera = useRef(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const pendingUri = useRef('');

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(cleanPendingTrialVideo).catch(() => {
      if (mounted.current) setError(t("Chưa xóa được video thử còn tồn. Bấm Dọn video thử để thử lại."));
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        try { camera.current?.stopRecording(); } catch { /* Unmount also stops the native recorder. */ }
        setReady(false);
        setForeground(false);
      } else {
        setForeground(true);
        void refreshPermission().catch(() => setError(t("Không kiểm tra được quyền camera.")));
      }
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      // CameraView unmount stops recording; the pending promise deletes any returned file.
    };
  }, [refreshPermission]);

  function cleanup() {
    try {
      if (pendingUri.current) { deleteTrialVideo(pendingUri.current); pendingUri.current = ''; }
      cleanPendingTrialVideo();
      setError('');
      setMessage(t("Đã dọn video thử. Không lưu vào thư viện ảnh hoặc gửi lên mạng."));
      return true;
    } catch {
      setError(t("Chưa xóa được video thử. Hãy bấm Dọn video thử để thử lại."));
      return false;
    }
  }

  async function record() {
    const device = camera.current;
    if (!device || !ready || inFlight.current || !cleanup()) return;
    inFlight.current = true;
    setRecording(true);
    setSeconds(0);
    setMessage(t("Đang ghi thử, tự dừng sau tối đa 10 giây."));
    let resultUri = '';
    try {
      const result = await device.recordAsync({ maxDuration: 10, maxFileSize: 15 * 1024 * 1024 });
      if (!result?.uri) throw new Error('No video');
      resultUri = result.uri;
      pendingUri.current = resultUri;
      const file = new File(resultUri);
      const size = file.size;
      const valid = file.exists && size > 0;
      deleteTrialVideo(resultUri);
      pendingUri.current = '';
      if (mounted.current) {
        if (!valid) setError(t("Video thử không có dữ liệu. Hãy thử quay lại."));
        else setMessage(t("Đã ghi thử {0} MB và xóa video tạm. Chưa phân tích chuyển động mắt.", [(size / 1024 / 1024).toFixed(2)]));
      }
    } catch {
      let removed = true;
      if (resultUri) {
        try { deleteTrialVideo(resultUri); pendingUri.current = ''; } catch { removed = false; }
      }
      if (mounted.current) setError(removed ? t("Không hoàn tất quay thử. Kiểm tra quyền camera, dung lượng trống rồi thử lại.") : t("Chưa xóa được video thử. Bấm Dọn video thử để thử lại."));
    } finally {
      inFlight.current = false;
      if (mounted.current) setRecording(false);
    }
  }

  function close() {
    if (inFlight.current) {
      Alert.alert(t("Dừng quay thử?"), t("Video thử sẽ được xóa sau khi dừng. Chờ xử lý xong rồi đóng camera."), [
        { text: t("Tiếp tục quay"), style: 'cancel' },
        { text: t("Dừng quay"), onPress: stop },
      ]);
    } else if (cleanup()) onClose();
  }

  function stop() {
    try { camera.current?.stopRecording(); } catch { setError(t("Chưa dừng được camera. Video sẽ tự giới hạn tối đa 10 giây.")); }
  }

  async function askPermission() {
    try { await requestPermission(); } catch { setError(t("Không yêu cầu được quyền camera. Hãy kiểm tra trong Cài đặt.")); }
  }

  return <Modal visible presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaProvider><SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.badge}>{t("THỬ CAMERA · KHÔNG THU ÂM")}</Text>
        <Text style={styles.title}>{t("Kiểm tra camera trước")}</Text>
        <Text style={styles.body}>{t("Quay thử riêng tối đa 10 giây. Video tự xóa sau khi ghi xong; chưa quay cùng bài kiểm tra.")}</Text>
        {Platform.OS === 'web' ? <Text style={styles.body}>{t("Hãy thử camera bằng Expo Go trên điện thoại.")}</Text> : !permission ? <Text style={styles.body}>{t("Đang kiểm tra quyền camera…")}</Text> : !permission.granted ? <View style={styles.panel}>
          <Text style={styles.body}>{t("Cần quyền camera để xem hình ảnh. Bạn vẫn có thể chạy các bài mô phỏng khi không cấp quyền.")}</Text>
          {permission.canAskAgain ? <Button onPress={askPermission}>{t("Cho phép camera")}</Button> : <Button onPress={() => { void Linking.openSettings().catch(() => setError(t("Không mở được Cài đặt. Hãy mở thủ công quyền Camera của ứng dụng."))); }}>{t("Mở Cài đặt để cấp quyền")}</Button>}
        </View> : foreground ? <>
          <View style={styles.preview}>
            <CameraView key={cameraKey} ref={camera} style={StyleSheet.absoluteFill} facing="front" mode="video" mute videoQuality="480p"
              onCameraReady={() => { setReady(true); }}
              onMountError={() => { setReady(false); setError(t("Không mở được camera. Đóng camera rồi thử lại.")); }}
              onRecordingProgress={(event) => setSeconds(Math.floor(event.duration))} />
          </View>
          <Text style={styles.status} accessibilityLiveRegion="polite">{recording ? t("● Đang ghi thử · {0}/10 giây", [seconds]) : ready ? t("Camera sẵn sàng · Chưa ghi hình") : t("Đang mở camera…")}</Text>
          {recording ? <Button onPress={stop}>{t("Dừng quay thử")}</Button> : <Button disabled={!ready || !!error} onPress={record}>{t("Quay thử tối đa 10 giây")}</Button>}
        </> : <Text style={styles.body}>{t("Camera đã tắt khi bạn rời ứng dụng.")}</Text>}
        {error ? <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Button secondary disabled={recording} onPress={() => { if (cleanup()) { setReady(false); setCameraKey((key) => key + 1); } }}>{t("Dọn video thử và thử lại")}</Button></> : <Text style={styles.body}>{message}</Text>}
        <Button secondary onPress={close}>{t("Đóng camera")}</Button>
      </ScrollView>
    </SafeAreaView></SafeAreaProvider>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 16, maxWidth: 700, width: '100%', alignSelf: 'center' },
  badge: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  title: { color: colors.text, fontSize: 27, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  panel: { gap: 14, padding: 18, backgroundColor: colors.surface, borderRadius: 16 },
  preview: { aspectRatio: 3 / 4, maxHeight: 400, width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#102A43' },
  status: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 16, lineHeight: 25 },
});
