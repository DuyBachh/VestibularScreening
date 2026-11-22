import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';
import { stimulusGeometry } from './stimulusGeometry';
import { gazeCueAt } from './gazeCue';
import { oknMotionPlan } from './oknMotion';
import { OknStripes } from './OknStripes';

/** @param {{id: string, demo?: boolean, compact?: boolean, embedded?: boolean}} props */
export function TestPreparation({ id, demo = false, compact = false, embedded = false }) {
  useLanguage();
  const pursuit = id === 'smooth-pursuit';
  const vertical = id === 'vertical-saccades';
  const anti = id === 'anti-saccade';
  const gaze = id === 'gaze-evoked';
  const okn = id === 'okn';
  const [playing, setPlaying] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));
  const stop = useCallback(() => setPlaying(false), []);

  useFocusEffect(useCallback(() => stop, [stop]));
  useEffect(() => {
    let mounted = true;
    /** @param {boolean} reduced */
    function update(reduced) { if (mounted) { setMotionAllowed(!reduced); if (reduced) stop(); } }
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => {});
    const preference = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    const state = AppState.addEventListener('change', (value) => { if (value !== 'active') stop(); });
    const blur = AppState.addEventListener('blur', stop);
    return () => { mounted = false; preference.remove(); state.remove(); blur.remove(); };
  }, [stop]);

  useEffect(() => {
    position.setValue(anti ? -1 : 0);
    if (!playing || !motionAllowed) return;
    const finish = setTimeout(stop, 8000);
    /** @type {ReturnType<typeof setInterval> | undefined} */
    let jump;
    /** @type {import('react-native').Animated.CompositeAnimation | undefined} */
    let animation;
    if (okn) {
      const plan = oknMotionPlan(0, true);
      animation = Animated.sequence(plan.steps.map((step) => Animated.timing(position, { ...step, easing: Easing.linear, useNativeDriver: true, isInteraction: false })));
      animation.start();
    } else if (pursuit) {
      animation = Animated.loop(Animated.sequence([
        Animated.timing(position, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
        Animated.timing(position, { toValue: -1, duration: 2400, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
        Animated.timing(position, { toValue: 0, duration: 1200, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
      ]));
      animation.start();
    } else if (gaze) {
      const started = Date.now();
      jump = setInterval(() => position.setValue(gazeCueAt(Date.now() - started, true)), 50);
    } else {
      const locations = anti ? [1, -1] : [1, 0, -1, 0];
      let index = 0;
      jump = setInterval(() => { position.setValue(locations[index % locations.length]); index++; }, 800);
    }
    return () => { clearTimeout(finish); if (jump) clearInterval(jump); animation?.stop(); position.stopAnimation(); };
  }, [playing, motionAllowed, pursuit, position, stop, anti, gaze, okn]);

  const { range } = stimulusGeometry(id, width, 180, true);
  return <View style={[styles.card, embedded && styles.embedded]}>
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>{compact ? t("CÁCH THỰC HIỆN") : t("1 · HIỂU CÁCH THỰC HIỆN")}</Text>
      <Text accessibilityRole="header" style={styles.title}>{okn ? t("Quan sát các dải chuyển động") : pursuit ? t("Nhìn theo chấm di chuyển") : gaze ? t("Giữ ánh nhìn tại các vị trí") : anti ? t("Nhìn về phía đối diện chấm") : vertical ? t("Nhìn nhanh theo chiều dọc") : t("Chuyển mắt tới chấm vừa xuất hiện")}</Text>
      <Text style={styles.body}>{okn ? t("Quan sát các dải sáng–tối chạy ngang, giữ đầu cố định. Dải chạy sang phải trong 15 giây đầu rồi sang trái trong 15 giây còn lại.") : pursuit ? t("Chấm vàng đi liên tục sang hai bên. Dùng mắt theo dõi chấm trong suốt chuyển động, giữ đầu cố định.") : gaze ? t("Chấm vàng đứng yên rồi chuyển sang vị trí tiếp theo: giữa → trái → giữa → phải → giữa. Giữ ánh nhìn tại chấm, không xoay đầu theo chấm.") : anti ? t("Bắt đầu nhìn ở giữa. Khi chấm vàng xuất hiện bên trái, nhìn sang phải; khi chấm ở bên phải, nhìn sang trái. Giữ đầu cố định.") : vertical ? t("Chấm vàng đổi vị trí ngay giữa trên, giữa và dưới. Nhìn nhanh tới vị trí mới, giữ đầu cố định, không gật đầu theo chấm.") : t("Chấm vàng đổi vị trí ngay giữa trái, giữa và phải. Nhìn nhanh tới vị trí mới, giữ đầu cố định.")}</Text>
      {okn ? <View style={styles.antiGuide}><Text style={styles.antiRule}>{t("Đổi hướng giữa lượt · 30 giây")}</Text><Text style={styles.body}>{t("Mẫu 8 giây đổi hướng sau 4 giây. Dừng nếu thấy khó chịu. Đây là mô phỏng học tập, chưa tự đánh giá phản xạ mắt.")}</Text></View> : null}
      {gaze ? <View style={styles.antiGuide}><Text style={styles.antiRule}>{t("Giữ tại mỗi vị trí · 6 giây")}</Text><Text style={styles.body}>{t("Lượt mô phỏng dài 30 giây. Mẫu 8 giây bên dưới chạy nhanh hơn để minh họa. Chưa phát hiện hoặc đánh giá rung giật nhãn cầu.")}</Text></View> : null}
      {anti ? <View style={styles.antiGuide}><Text style={styles.antiRule}>{t("Chấm trái → Nhìn phải")}</Text><Text style={styles.antiRule}>{t("Chấm phải → Nhìn trái")}</Text><Text style={styles.body}>{t("Chưa tự xác định ánh nhìn hoặc chấm đúng/sai.")}</Text></View> : null}
    </View>
    {okn ? <View style={styles.diagram}><View accessible accessibilityRole="image" accessibilityLabel={t("Minh họa dải sáng tối chuyển động ngang sang phải rồi sang trái")} style={styles.stripeStage} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}><OknStripes position={position} width={width} /></View><Text style={[styles.caption, styles.lightCaption]}>{t("Dải chuyển động ngang · Đổi hướng giữa lượt")}</Text></View> : <View style={styles.diagram}>
      <View accessible accessibilityRole="image" accessibilityLabel={pursuit ? t("Minh họa chấm đi liên tục theo chiều ngang qua trái, giữa và phải.") : gaze ? t("Minh họa chấm đứng yên tại giữa, trái, giữa, phải rồi giữa. Giữ ánh nhìn tại từng vị trí.") : anti ? t("Minh họa: chấm vàng ở một bên, vòng xanh chỉ hướng cần nhìn ở bên đối diện. Vòng xanh chỉ có trong hướng dẫn.") : vertical ? t("Minh họa chấm xuất hiện ở trên, giữa hoặc dưới, không trượt giữa các vị trí.") : t("Minh họa chấm xuất hiện ở từng vị trí trái, giữa hoặc phải, không trượt giữa các vị trí.")}
        style={[styles.stage, vertical && styles.verticalStage]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <View style={vertical ? styles.verticalPath : styles.path} />
        {[-1, 0, 1].map((value) => <View key={value} style={[styles.marker, { transform: [vertical ? { translateY: value * range } : { translateX: value * range }] }]} />)}
        {anti ? <Animated.View style={[styles.gazeHint, { transform: [{ translateX: position.interpolate({ inputRange: [-1, 1], outputRange: [range, -range] }) }] }]} /> : null}
        <Animated.View style={[styles.dot, { transform: [vertical ? { translateY: position.interpolate({ inputRange: [-1, 1], outputRange: [-range, range] }) } : { translateX: position.interpolate({ inputRange: [-1, 1], outputRange: [-range, range] }) }] }]} />
        {vertical ? [t("Trên"), t("Giữa"), t("Dưới")].map((label, index) => <Text key={label} style={[styles.label, styles.verticalLabel, { transform: [{ translateY: (index - 1) * range }] }]}>{label}</Text>) : null}
      </View>
      {!vertical ? <View style={styles.labels}><Text style={styles.label}>{t("Trái")}</Text><Text style={styles.label}>{t("Giữa")}</Text><Text style={styles.label}>{t("Phải")}</Text></View> : null}
      <Text style={[styles.caption, styles.lightCaption]}>{pursuit ? t("← Đi liên tục →") : gaze ? t("Chấm đứng yên · Giữ ánh nhìn tại chấm") : anti ? t("Chấm vàng: vị trí xuất hiện\nVòng xanh: hướng cần nhìn (chỉ minh họa)") : t("Đổi vị trí · Nhìn tới chấm mới")}</Text>
    </View>}
    <Button secondary disabled={!motionAllowed || width === 0} onPress={() => setPlaying((value) => !value)}>{playing ? t("Dừng chuyển động mẫu") : t("Xem chuyển động mẫu · 8 giây")}</Button>
    <Text accessibilityLiveRegion="polite" style={styles.caption}>{!motionAllowed ? t("Minh họa tĩnh. Chuyển động mẫu tắt khi thiết bị bật Giảm chuyển động hoặc chưa đọc được cài đặt.") : playing ? t("Đang xem mẫu, tự dừng sau 8 giây. Không quay hoặc lưu phiên.") : t("Chỉ minh họa cách nhìn. Xem mẫu không quay camera hoặc lưu lịch sử.")}</Text>
    {!compact ? <>
    <View style={styles.divider} />
    <Text accessibilityRole="header" style={styles.section}>{t("Chuẩn bị trước khi bắt đầu")}</Text>
    {[
      ['01', t("Ổn định tư thế"), t("Ngồi thoải mái, đặt điện thoại ổn định và giữ đầu cố định.")],
      ['02', t("Chọn cách chạy"), demo ? t("Demo dùng hồ sơ mẫu đã chọn. Không bật camera hoặc lưu vào lịch sử tài khoản.") : t("Chọn hồ sơ nếu cần lưu lịch sử. Camera là tùy chọn, có thể chạy khi tắt camera.")],
      ['03', t("Nhìn theo hướng dẫn"), t("Bấm Bắt đầu ở bên dưới, chờ 3 giây chuẩn bị rồi thực hiện lượt mô phỏng 30 giây.")],
    ].map(([number, title, body]) => <View key={number} style={styles.step}>
      <View style={styles.number}><Text style={styles.numberText}>{number}</Text></View>
      <View style={styles.stepText}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.body}>{body}</Text></View>
    </View>)}
    </> : null}
    <View style={styles.note}><Text style={styles.noteTitle}>{t("Bạn luôn có thể tạm dừng")}</Text><Text style={styles.body}>{compact ? t("Ngồi thoải mái, giữ điện thoại ổn định và đầu cố định. ") : ''}{t("Dừng nếu thấy khó chịu. Khi chuyển ứng dụng, lượt chạy tự tạm dừng. Đây là mô phỏng học tập, chưa đo mắt hoặc đưa kết luận.")}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#D5E0E8', backgroundColor: colors.surface, gap: 14 },
  embedded: { padding: 0, borderWidth: 0, backgroundColor: 'transparent' },
  heading: { gap: 8 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  antiGuide: { padding: 13, borderRadius: 12, backgroundColor: colors.tint, gap: 6 }, antiRule: { color: colors.primary, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  title: { color: colors.text, fontSize: 21, lineHeight: 29, fontWeight: '700' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  diagram: { padding: 14, borderRadius: 16, backgroundColor: '#102A43', gap: 8 },
  stripeStage: { height: 140, overflow: 'hidden', borderRadius: 10 },
  stage: { height: 68, justifyContent: 'center', alignItems: 'center' },
  verticalStage: { height: 180 }, verticalPath: { position: 'absolute', top: 26, bottom: 26, width: 1, backgroundColor: '#526D82' }, verticalLabel: { position: 'absolute', left: '60%', right: 0 },
  path: { position: 'absolute', left: 26, right: 26, height: 1, backgroundColor: '#526D82' },
  marker: { position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#829AB1' },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FDE047' },
  gazeHint: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#67E8F9' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14 }, label: { color: '#E6F0F5', fontSize: 13 },
  caption: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  lightCaption: { color: '#E6F0F5' },
  divider: { height: 1, backgroundColor: '#DCE4EB', marginVertical: 2 }, section: { color: colors.text, fontSize: 17, fontWeight: '700' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, number: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.primary, fontSize: 13, fontWeight: '700' }, stepText: { flex: 1, gap: 3 }, stepTitle: { color: colors.text, fontWeight: '600', fontSize: 16, lineHeight: 23 },
  note: { padding: 14, backgroundColor: colors.tint, borderRadius: 12, gap: 4 }, noteTitle: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
