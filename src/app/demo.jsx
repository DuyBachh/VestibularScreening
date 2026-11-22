import { t, genderLabel } from '../features/language/language.js';
import { useLanguage } from '../features/language/LanguageProvider';
import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { StimulusPlayer } from '../features/tests/StimulusPlayer';
import { testCatalog, supportedTests } from '../features/tests/catalog';
import { appendDemoSession, DEMO_PATIENTS } from '../features/demo/demoData';
import { LearningFold, LearningScreen, learningStyles } from '../features/guide/LearningUI';
import { colors } from '../constants/theme';
import { testPresentation } from '../features/tests/testPresentation';

export default function DemoScreen() {
  useLanguage();
  const [stage, setStage] = useState('choose');
  const [patientIndex, setPatientIndex] = useState(0);
  const [testIndex, setTestIndex] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [openSessionId, setOpenSessionId] = useState('');
  const [sessions, setSessions] = useState(/** @type {import('../features/demo/demoData').DemoSession[]} */ ([]));
  const patient = DEMO_PATIENTS[patientIndex];
  const test = supportedTests[testIndex];
  function clearDemo() {
    Alert.alert(t("Xóa các lượt demo?"), t("Danh sách và ghi chú demo sẽ bị bỏ. Dữ liệu tài khoản không thay đổi."), [
      { text: t("Giữ lại"), style: 'cancel' }, { text: t("Xóa lượt demo"), style: 'destructive', onPress: () => { setSessions([]); setOpenSessionId(''); setGeneration((value) => value + 1); } },
    ]);
  }
  return <LearningScreen key={stage} title={t("Thử Demo")} subtitle={stage === 'choose' ? t("Làm quen với ứng dụng bằng hồ sơ mẫu.") : t("Xem cách thực hiện rồi bắt đầu khi sẵn sàng.")}>
    <View style={styles.steps}><View style={[styles.step, stage === 'choose' && styles.activeStep]}><Text style={[styles.stepText, stage === 'choose' && styles.activeStepText]}>{t("1 · Chọn hồ sơ và bài")}</Text></View><View style={[styles.step, stage === 'try' && styles.activeStep]}><Text style={[styles.stepText, stage === 'try' && styles.activeStepText]}>{t("2 · Chạy thử")}</Text></View></View>
    <View style={styles.notice}><Text style={styles.noticeTitle}>{t("DỮ LIỆU MÔ PHỎNG · DEMO")}</Text><Text style={learningStyles.body}>{t("Không bật camera, không lưu vào tài khoản. Các lượt thử và ghi chú mất khi thoát màn Demo.")}</Text></View>
    {stage === 'choose' ? <>
      <View style={styles.section}><Text accessibilityRole="header" style={learningStyles.section}>{t("Bạn muốn thử với hồ sơ nào?")}</Text><Text style={learningStyles.body}>{t("Hai hồ sơ bên dưới đều là dữ liệu mẫu.")}</Text>
        <View style={styles.patients}>{DEMO_PATIENTS.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: index === patientIndex }} onPress={() => setPatientIndex(index)} style={({ pressed }) => [styles.patient, index === patientIndex && styles.selected, pressed && styles.pressed]}>
          <View style={styles.choiceHeading}><Text style={styles.patientCode}>{item.code}</Text><Text accessible={false} style={styles.check}>{index === patientIndex ? '✓' : '○'}</Text></View>
          <Text style={styles.name}>{item.name.replace(' (mẫu)', '')}</Text><Text style={learningStyles.body}>{genderLabel(item.gender)} {t(" · Hồ sơ mẫu")}</Text>
        </Pressable>)}</View>
      </View>
      <View style={styles.section}><Text accessibilityRole="header" style={learningStyles.section}>{t("Chọn bài bạn muốn làm quen")}</Text>
        {supportedTests.map((item, index) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: index === testIndex }} onPress={() => setTestIndex(index)} style={({ pressed }) => [styles.test, index === testIndex && styles.selected, pressed && styles.pressed]}>
          <View style={styles.testText}><Text style={styles.name}>{item.name}</Text><Text style={learningStyles.body}>{testPresentation(item.id).title}</Text></View>
          <Text accessible={false} style={styles.check}>{index === testIndex ? '✓' : '○'}</Text>
        </Pressable>)}
      </View>
      <Button onPress={() => setStage('try')}>{t("Tiếp tục → Hướng dẫn và chạy thử")}</Button>
      <Text style={styles.hint}>{t("3 giây chuẩn bị · 30 giây mỗi lượt")}</Text>
    </> : <>
      <View style={learningStyles.card}><Text style={styles.patientCode}>{t("LỰA CHỌN CỦA BẠN")}</Text><Text style={styles.name}>{patient.name}</Text><View style={{ gap: 4 }}><Text style={styles.name}>{test.name}</Text><Text style={learningStyles.body}>{testPresentation(test.id).title}</Text></View><Pressable accessibilityRole="button" style={styles.edit} onPress={() => setStage('choose')}><Text style={styles.editText}>{t("Đổi hồ sơ hoặc bài kiểm tra")}</Text></Pressable></View>
      <StimulusPlayer key={`${patient.id}:${test.id}:${generation}`} id={test.id} demo demoPatientName={patient.name} onDemoAdd={(session) => { setSessions((previous) => appendDemoSession(previous, session)); setShowHistory(true); setOpenSessionId(session.id); }} />
    </>}
    <LearningFold title={t("Các lượt đã thử · {0}", [sessions.length])} summary={t("Chỉ giữ tạm trong màn Demo")} expanded={showHistory} onPress={() => setShowHistory((value) => !value)}>
      {sessions.length ? <>
        <Text style={learningStyles.body}>{t("Tối đa 10 lượt gần nhất. Chạm một lượt để xem ghi chú.")}</Text>
        {sessions.map((session) => <View key={session.id} style={styles.session}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: openSessionId === session.id }} onPress={() => setOpenSessionId((previous) => previous === session.id ? '' : session.id)} style={styles.sessionHeading}>
            <View style={styles.testText}><Text style={styles.name}>{testCatalog.find((item) => item.id === session.testId)?.name || session.testId}</Text><Text style={learningStyles.body}>{session.patientName}</Text><Text style={styles.english}>{session.status === 'completed' ? t("Hoàn tất") : t("Đã hủy")} · {Math.round(session.elapsedMs / 1000)} {t(" giây")}</Text></View>
            <Text accessible={false} style={styles.check}>{openSessionId === session.id ? '−' : '+'}</Text>
          </Pressable>
          {openSessionId === session.id ? <View style={styles.notes}><Text style={styles.english}>{t("GHI CHÚ DEMO")}</Text><Text style={learningStyles.body}>{session.notes || t("Chưa có ghi chú.")}</Text></View> : null}
        </View>)}
        <Pressable accessibilityRole="button" onPress={clearDemo} style={styles.edit}><Text style={styles.clearText}>{t("Xóa danh sách demo")}</Text></Pressable>
      </> : <Text style={learningStyles.body}>{t("Chưa có lượt nào. Chạy thử rồi bấm Thêm vào danh sách demo ở màn kết thúc để xem lại tại đây.")}</Text>}
    </LearningFold>
    <Button secondary onPress={() => router.replace('/')}>{t("Thoát Demo · Về trang chủ")}</Button>
  </LearningScreen>;
}
const styles = StyleSheet.create({
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, step: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#E8EDF2', flexGrow: 1, alignItems: 'center' }, stepText: { color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '600' }, activeStep: { backgroundColor: colors.primary }, activeStepText: { color: '#FFFFFF' },
  notice: { padding: 15, gap: 6, borderRadius: 14, backgroundColor: colors.tint }, noticeTitle: { fontSize: 11, lineHeight: 18, letterSpacing: 0.5, color: colors.primary, fontWeight: '700' },
  section: { gap: 12 }, patients: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, patient: { flexBasis: '45%', flexGrow: 1, padding: 14, gap: 8, borderRadius: 16, borderWidth: 1.5, borderColor: '#DCE4EB', backgroundColor: colors.surface },
  selected: { borderColor: colors.primary, backgroundColor: '#EDF6F8' }, pressed: { opacity: 0.75 }, choiceHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  patientCode: { color: colors.primary, fontSize: 12, lineHeight: 19, fontWeight: '700' }, check: { color: colors.primary, fontSize: 21, lineHeight: 27 }, name: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  test: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#DCE4EB', backgroundColor: colors.surface }, testText: { flex: 1, gap: 5 }, english: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: -10 }, edit: { minHeight: 44, justifyContent: 'center', paddingVertical: 8 }, editText: { color: colors.primary, fontSize: 15, lineHeight: 22, fontWeight: '600' }, clearText: { color: colors.danger, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  session: { borderRadius: 12, borderWidth: 1, borderColor: '#DCE4EB', overflow: 'hidden' }, sessionHeading: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, notes: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#DCE4EB', gap: 6, backgroundColor: '#F6F9FB' },
});
