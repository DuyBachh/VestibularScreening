import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../../constants/theme';
import { testPresentation } from './testPresentation';
import { runClock } from './runPresentation';
import { stimulusGeometry } from './stimulusGeometry';
import { OknStripes } from './OknStripes';
import { GAZE_X, GAZE_Y } from './gazeCue';

/** @param {{name: string, id: string, patientName: string, demo: boolean}} props */
export function RunHeader({ name, id, patientName, demo }) {
  useLanguage();
  return <View style={styles.header}>
    {demo ? <Text style={styles.demo}>{t("Demo · Không lưu vào tài khoản")}</Text> : null}
    <Text accessibilityRole="header" style={styles.name}>{name}</Text>
    <Text style={styles.translation}>{testPresentation(id).title}</Text>
    <Text style={styles.patient}>{patientName || t("Không gắn hồ sơ")}</Text>
  </View>;
}
/** @param {{title: string, remaining: number, withCamera: boolean}} props */
export function RunProgress({ title, remaining, withCamera }) {
  useLanguage();
  return <View style={styles.progressGroup}>
    <View style={styles.timerRow}><View style={styles.timerText}><Text accessibilityLiveRegion="polite" style={styles.status}>{title}</Text><Text style={styles.small}>{withCamera ? t("Có camera") : t("Không camera")}</Text></View><Text accessibilityLabel={t("Còn {0} giây", [remaining])} style={styles.clock}>{runClock(remaining)}</Text></View>
    <View accessibilityRole="progressbar" accessibilityLabel={t("Tiến độ lượt chạy")} accessibilityValue={{ min: 0, max: 30, now: 30 - remaining }} style={styles.track}><View style={[styles.progress, { width: `${(30 - remaining) / 30 * 100}%` }]} /></View>
  </View>;
}
/** @param {{id: string, status: string, countdown: number, processing: boolean, position: import('react-native').Animated.Value, width: number, onWidth: (width: number) => void}} props */
export function RunStage({ id, status, countdown, processing, position, width, onWidth }) {
  useLanguage();
  const { fontScale } = useWindowDimensions();
  const height = Math.max(260, Math.ceil(142 * fontScale + 80));
  const { axis, range } = stimulusGeometry(id, width, height);
  const anti = id === 'anti-saccade';
  const gaze = id === 'gaze-evoked';
  const verticalRange = stimulusGeometry('vertical-saccades', width, height).range;
  const gazeTransform = [
    { translateX: position.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: GAZE_X.map((x) => x * range) }) },
    { translateY: position.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: GAZE_Y.map((y) => y * verticalRange) }) },
  ];
  const okn = id === 'okn';
  const targetVisible = !processing && (status === 'running' || status === 'paused');
  const message = processing ? t("Đang dọn video") : status === 'countdown' ? String(countdown) : status === 'paused' ? t("Tạm dừng") : t("Chuẩn bị");
  return <View style={[styles.stage, { height }]} onLayout={(event) => onWidth(event.nativeEvent.layout.width)} accessibilityLabel={okn ? t("Vùng dải sáng tối mô phỏng chuyển động ngang") : gaze ? t('Vùng mục tiêu mô phỏng giữa, trái, phải, trên và dưới') : id === 'vertical-saccades' ? t("Vùng mục tiêu mô phỏng trên, giữa và dưới") : t("Vùng mục tiêu mô phỏng trái, giữa và phải")}>
    {targetVisible && okn ? <OknStripes position={position} width={width} paused={status === 'paused'} /> : targetVisible ? <Animated.View style={[styles.dot, status === 'paused' && styles.pausedDot, { transform: gaze ? gazeTransform : [axis === 'translateY' ? { translateY: position.interpolate({ inputRange: [-1, 1], outputRange: [-range, range] }) } : { translateX: position.interpolate({ inputRange: [-1, 1], outputRange: [-range, range] }) }] }]} /> : null}
    {status !== 'running' || processing ? <View style={styles.stageMessage}><Text style={[styles.stageTitle, status === 'countdown' && styles.countdown]}>{message}</Text><Text style={styles.stageHint}>{processing ? t("Chờ dừng ghi và xóa đoạn video tạm") : status === 'paused' ? okn ? t("Dải và thời gian đang dừng") : t("Điểm và thời gian đang dừng") : okn ? t("Chuẩn bị quan sát các dải chuyển động ngang.") : anti ? t("Bắt đầu ở giữa. Khi chấm sang bên, nhìn phía đối diện.") : gaze ? t("Chuẩn bị nhìn và giữ ánh nhìn tại chấm vàng.") : t("Chuẩn bị nhìn theo chấm vàng")}</Text></View> : <Text style={[styles.stageCaption, okn && styles.stripeCaption]}>{okn ? t("Giữ đầu cố định, quan sát các dải chuyển động.") : anti ? t("Giữ đầu cố định, nhìn phía đối diện chấm.") : gaze ? t("Giữ đầu cố định, giữ ánh nhìn tại chấm.") : t("Giữ đầu cố định, nhìn theo chấm vàng.")}</Text>}
  </View>;
}
/** @param {{status: string, elapsedMs: number, patientName: string, withCamera: boolean, cameraError: string, deletedSegments: number}} props */
export function RunResult({ status, elapsedMs, patientName, withCamera, cameraError, deletedSegments }) {
  useLanguage();
  const cancelled = status === 'cancelled';
  return <View style={styles.result}>
    <View style={styles.resultHeading}><View style={[styles.resultIcon, cancelled && styles.cancelledIcon]}><Text style={styles.resultMark}>{cancelled ? '−' : '✓'}</Text></View><Text accessibilityRole="header" style={styles.resultTitle}>{cancelled ? t("Đã hủy lượt chạy") : t("Đã hoàn tất")}</Text><Text style={styles.small}>{t("Lượt mô phỏng đã kết thúc.")}</Text></View>
    <View style={styles.metadata}>
      <View style={styles.dataRow}><Text style={styles.dataLabel}>{t("Hồ sơ")}</Text><Text style={styles.dataValue}>{patientName || t("Không gắn hồ sơ")}</Text></View>
      <View style={styles.dataRow}><Text style={styles.dataLabel}>{t("Thực hiện")}</Text><Text style={styles.dataValue}>{Math.round(elapsedMs / 1000)} {t(" giây")}</Text></View>
      <View style={styles.dataRow}><Text style={styles.dataLabel}>Camera</Text><Text style={[styles.dataValue, !!cameraError && styles.errorText]}>{!withCamera ? t("Không sử dụng") : cameraError ? t("Có lỗi, không xác nhận ghi hình thành công") : deletedSegments > 0 ? t("Đã xóa {0} đoạn video tạm", [deletedSegments]) : t("Không có đoạn ghi được xác nhận")}</Text></View>
    </View>
  </View>;
}
/** @param {{message: string}} props */
export function CameraProblem({ message }) {
  useLanguage();
  return <View accessibilityRole="alert" style={styles.problem}><Text style={styles.problemTitle}>{t("Camera gặp sự cố")}</Text><Text style={styles.problemText}>{message}</Text><Text style={styles.problemText}>{t("Lượt chạy đang tạm dừng. Kết thúc lượt rồi kiểm tra camera hoặc chạy lại không camera.")}</Text></View>;
}
export const runScreenStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 24, gap: 13, flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, control: { flex: 1, minWidth: 125 }, resultControls: { gap: 10 },
  footer: { color: colors.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', paddingTop: 3 }, small: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  exit: { minHeight: 44, justifyContent: 'center', alignItems: 'center', padding: 8 }, exitText: { color: colors.primary, fontSize: 14, lineHeight: 22, fontWeight: '600' },
});
const styles = StyleSheet.create({
  header: { gap: 4, paddingBottom: 2 }, name: { color: colors.text, fontSize: 23, lineHeight: 31, fontWeight: '700' }, translation: { color: colors.muted, fontSize: 14, lineHeight: 22 }, patient: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 2 }, demo: { color: colors.primary, fontSize: 11, lineHeight: 18, fontWeight: '600' },
  progressGroup: { gap: 9 }, timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, timerText: { flex: 1, gap: 2 }, status: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '600' }, small: { color: colors.muted, fontSize: 13, lineHeight: 21 }, clock: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 5, borderRadius: 3, backgroundColor: '#DCE7ED', overflow: 'hidden' }, progress: { height: '100%', backgroundColor: colors.primary },
  stage: { height: 260, borderRadius: 18, backgroundColor: '#102A43', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FDE047' }, pausedDot: { opacity: 0.22 },
  stripeCaption: { backgroundColor: '#102A43', borderRadius: 8, padding: 6 },
  stageMessage: { position: 'absolute', left: 18, right: 18, gap: 7 }, stageTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 34, fontWeight: '700', textAlign: 'center' }, countdown: { fontSize: 58, lineHeight: 72 }, stageHint: { color: '#E0EAF1', fontSize: 14, lineHeight: 22, textAlign: 'center' }, stageCaption: { position: 'absolute', bottom: 13, left: 12, right: 12, color: '#D9E6EE', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  result: { gap: 18 }, resultHeading: { alignItems: 'center', gap: 7, paddingVertical: 8 }, resultIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }, cancelledIcon: { backgroundColor: '#E8EDF2' }, resultMark: { color: colors.primary, fontSize: 25, lineHeight: 32, fontWeight: '600' }, resultTitle: { color: colors.text, fontSize: 25, lineHeight: 34, fontWeight: '700', textAlign: 'center' },
  metadata: { borderRadius: 17, padding: 16, borderWidth: 1, borderColor: '#DCE4EB', backgroundColor: '#FFFFFF', gap: 13 }, dataRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, dataLabel: { color: colors.muted, fontSize: 13, lineHeight: 21, flex: 1 }, dataValue: { color: colors.text, fontSize: 13, lineHeight: 21, fontWeight: '600', flex: 2, textAlign: 'right' }, errorText: { color: colors.danger },
  problem: { padding: 17, gap: 10, borderRadius: 17, borderWidth: 1, borderColor: '#EDCCCC', backgroundColor: '#FFF8F8' }, problemTitle: { color: colors.danger, fontSize: 17, lineHeight: 25, fontWeight: '700' }, problemText: { color: colors.muted, fontSize: 14, lineHeight: 22 },
});
