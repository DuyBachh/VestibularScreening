import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import { useAuth } from '../auth/AuthProvider';
import { LearningScreen, learningStyles } from '../guide/LearningUI';
import { SettingsRow } from '../settings/SettingsUI';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';
import { PatientPicker } from './PatientPicker';
import { supportedTests } from './catalog';
import { testPresentation } from './testPresentation';
import { StimulusPlayer } from './StimulusPlayer';
import { batterySummary, finishBatteryExercise, newBattery } from './batteryFlow';
import { batteryDatabase } from '../../services/batteryDatabase';
import { makeBatteryId } from '../../services/batteryRepository';

export function BatteryScreen() {
  useLanguage();
  const auth = useAuth();
  return <BatteryContent key={auth.isSignedIn ? auth.session?.user.id : 'preview'} />;
}

function BatteryContent() {
  useLanguage();
  const auth = useAuth();
  const ownerId = auth.isSignedIn ? auth.session?.user.id || '' : '';
  const account = useRef(auth);
  useLayoutEffect(() => { account.current = auth; }, [auth]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const [patient, setPatient] = useState(/** @type {import('../../services/patientDatabase').PatientRecord | null} */ (null));
  const [camera, setCamera] = useState(false);
  const [picker, setPicker] = useState(false);
  const [stage, setStage] = useState('setup');
  const [flow, setFlow] = useState(newBattery);
  const [config, setConfig] = useState(/** @type {{ownerId: string, patient: import('../../services/patientDatabase').PatientRecord | null, camera: boolean, batteryId?: string} | null} */ (null));
  const current = supportedTests[flow.results.length];
  const counts = batterySummary(flow);
  const inProgress = stage === 'exercise' || stage === 'rest';
  function isCurrent() { return account.current.isSignedIn && account.current.session?.user.id === ownerId && !account.current.endingSession; }
  async function closeSequence() {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try {
      if (config?.batteryId) { await batteryDatabase.end(ownerId, config.batteryId, isCurrent); if (!isCurrent()) return; }
      setFlow((state) => ({ ...state, finished: true })); setStage('summary');
    } catch { setError(t('Chưa lưu được tiến độ chuỗi. Hãy thử lại.')); }
    finally { lock.current = false; setSaving(false); }
  }

  function endBeforeRun() {
    Alert.alert(t("Kết thúc chuỗi?"), t("Các lượt đã lưu vẫn nằm trong Lịch sử. Các bài chưa chạy sẽ không được tạo thành phiên."), [
      { text: t("Tiếp tục chuỗi"), style: 'cancel' }, { text: t("Kết thúc chuỗi"), style: 'destructive', onPress: () => { void closeSequence(); } },
    ]);
  }
  usePreventRemove(inProgress && config?.ownerId === ownerId && !auth.endingSession, () => {
    if (stage === 'exercise') Alert.alert(t("Chuỗi đang thực hiện"), t("Hãy dùng Kết thúc trên màn chạy, sau đó chọn Kết thúc chuỗi ở kết quả. Nếu chưa bắt đầu bài, dùng nút Kết thúc chuỗi bên dưới."));
    else endBeforeRun();
  });

  /** @param {import('./batteryFlow').BatteryResult} result @param {boolean} end */
  function finish(result, end) {
    const next = finishBatteryExercise(flow, result, end);
    if (next === flow) return;
    setFlow(next);
    setStage(next.finished ? 'summary' : 'rest');
  }
  async function start() {
    if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try {
      const actualCamera = Platform.OS !== 'web' && camera;
      const batteryId = ownerId ? makeBatteryId() : undefined;
      if (batteryId) { await batteryDatabase.create(ownerId, { id: batteryId, patientId: patient?.id || null, camera: actualCamera }, isCurrent); if (!isCurrent()) return; }
      setConfig({ ownerId, patient, camera: actualCamera, batteryId }); setFlow(newBattery()); setStage('exercise');
    } catch { setError(t('Không tạo được chuỗi đã lưu. Chưa bắt đầu bài; hãy thử lại.')); }
    finally { lock.current = false; setSaving(false); }
  }
  /** @param {import('./batteryFlow').BatteryResult} result @param {boolean} end */
  async function persistResult(result, end) {
    if (config?.batteryId) await batteryDatabase.finish(ownerId, config.batteryId, flow.results.length, result, end, isCurrent);
  }

  return <LearningScreen title={stage === 'summary' ? t("Tổng hợp chuỗi") : t("Chạy chuỗi 6 bài")} subtitle={stage === 'setup' ? t("Thiết lập một lần, nghỉ giữa các bài và lưu từng lượt riêng.") : `${config?.patient?.name || t("Không gắn hồ sơ")} · Camera ${config?.camera ? t("bật") : t("tắt")}`}>
    {stage === 'setup' ? <>
      <View style={learningStyles.card}><Text style={learningStyles.section}>{t("Trước khi bắt đầu")}</Text><Text style={learningStyles.body}>{t("6 bài × 30 giây thực hiện, chưa gồm đếm ngược và thời gian nghỉ. Bạn chủ động bắt đầu từng bài, không tự chuyển chạy.")}</Text>
        {ownerId ? <SettingsRow title={patient?.name || t("Không gắn hồ sơ")} subtitle={patient ? t("{0} · Chạm để đổi", [patient.code]) : t("Chọn hồ sơ dùng chung cho cả chuỗi")} onPress={() => setPicker(true)} /> : <Text style={learningStyles.body}>{t("Bạn đang xem trước. Các lượt không lưu vào Lịch sử tài khoản.")}</Text>}
        {Platform.OS !== 'web' ? <View style={styles.cameraRow}><View style={styles.copy}><Text style={styles.name}>{t("Camera trong chuỗi")}</Text><Text style={learningStyles.body}>{t("Không thu âm · Dọn video tạm sau mỗi đoạn")}</Text></View><Switch accessibilityLabel={t("Camera trong chuỗi")} value={camera} onValueChange={setCamera} /></View> : null}
        <Text style={learningStyles.body}>{t('Khi đăng nhập, tổng hợp chuỗi được lưu trên thiết bị. Lưu từng lượt để giữ ghi chú trong Lịch sử; có thể giữ bản nháp hoặc bỏ lượt trước khi tiếp tục.')}</Text>
        <Button loading={saving} onPress={() => { void start(); }}>{t("Bắt đầu chuỗi")}</Button>
      </View>
      <View style={learningStyles.card}><Text style={learningStyles.section}>{t("Thứ tự thực hiện")}</Text>{supportedTests.map((test, index) => <View key={test.id} style={styles.row}><Text style={styles.number}>{index + 1}</Text><View style={styles.copy}><Text style={styles.name}>{test.name}</Text><Text style={learningStyles.body}>{testPresentation(test.id).title}</Text></View></View>)}</View>
    </> : null}
    {stage === 'exercise' && current && config ? <>
      <Text style={styles.badge}>{t("Bài ")}{flow.results.length + 1}/{supportedTests.length}</Text>
      <View style={styles.heading}><Text style={learningStyles.section}>{current.name}</Text><Text style={learningStyles.body}>{testPresentation(current.id).title}</Text></View>
      <StimulusPlayer key={current.id} id={current.id} battery={{ ...config, ordinal: flow.results.length, persistResult, label: t("Bài {0}/{1}", [flow.results.length + 1, supportedTests.length]), last: flow.results.length === supportedTests.length - 1, onFinish: finish }} />
      <Button secondary disabled={saving} onPress={endBeforeRun}>{t("Kết thúc chuỗi")}</Button>
    </> : null}
    {stage === 'rest' && current ? <View style={learningStyles.card}>
      <Text style={styles.badge}>{t("Đã thực hiện ")}{flow.results.length}/{supportedTests.length} {t(" bài")}</Text><Text style={learningStyles.section}>{t("Nghỉ trước bài tiếp theo")}</Text>
      <Text style={learningStyles.body}>{t("Bạn có thể nghỉ bao lâu tùy ý. Camera đã dừng; bài tiếp theo chỉ mở khi bạn chọn Tiếp tục.")}</Text>
      <Text style={styles.name}>{current.name}</Text><Text style={learningStyles.body}>{testPresentation(current.id).title}</Text>
      <Text style={learningStyles.body}>{ownerId ? <>{counts.saved} {t(" lượt đã lưu vào Lịch sử. ")}{flow.results.length - counts.saved} {t('lượt chưa lưu lịch sử; có thể còn bản nháp.')}</> : t('Lượt xem trước không ghi lịch sử hoặc tổng hợp chuỗi trên thiết bị.')}</Text>
      <Button disabled={saving} onPress={() => setStage('exercise')}>{t("Tiếp tục · Bài ")}{flow.results.length + 1}/{supportedTests.length}</Button><Button secondary loading={saving} onPress={endBeforeRun}>{t("Kết thúc chuỗi")}</Button>
    </View> : null}
    {stage === 'summary' ? <>
      <View style={learningStyles.card}><Text style={learningStyles.section}>{counts.remaining ? t("Chuỗi đã kết thúc sớm") : t("Đã đi qua đủ 6 bài")}</Text><Text style={learningStyles.body}>{counts.completed} {t(" hoàn tất · ")}{counts.cancelled} {t(" đã hủy · ")}{counts.remaining} {t(" chưa thực hiện")}</Text><Text style={learningStyles.body}>{config?.batteryId ? <>{counts.saved} {t('lượt đã lưu lịch sử. Mở tổng hợp đã lưu để xem nguồn dữ liệu và xuất PDF chuỗi.')}</> : t('Lượt xem trước không ghi lịch sử hoặc tổng hợp chuỗi trên thiết bị.')}</Text></View>
      <View style={learningStyles.card}>{supportedTests.map((test, index) => {
        const result = flow.results.find((item) => item.testId === test.id);
        return <View key={test.id} style={styles.row}><Text style={styles.number}>{index + 1}</Text><View style={styles.copy}><Text style={styles.name}>{test.name}</Text><Text style={learningStyles.body}>{result ? t("{0} · {1} giây · {2}", [result.status === 'completed' ? t("Hoàn tất") : t("Đã hủy"), Math.round(result.elapsedMs / 1000), result.saved ? t("Đã lưu") : t("Không lưu")]) : t("Chưa thực hiện")}</Text>{result?.cameraError ? <Text style={styles.error}>{t("Có lỗi camera trong lượt này")}</Text> : null}</View></View>;
      })}</View>
      {ownerId ? <Button onPress={() => router.push('/history')}>{t("Xem Lịch sử")}</Button> : null}
      {config?.batteryId ? <Button onPress={() => router.push({ pathname: '/battery-results/[id]', params: { id: config.batteryId } })}>{t('Mở tổng hợp và PDF chuỗi')}</Button> : null}
      <Button secondary onPress={() => { setFlow(newBattery()); setConfig(null); setStage('setup'); }}>{t("Chuẩn bị chuỗi mới")}</Button>
    </> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {picker && ownerId ? <PatientPicker ownerId={ownerId} onClose={() => setPicker(false)} onSelect={(item) => { setPatient(item); setPicker(false); }} /> : null}
  </LearningScreen>;
}
const styles = StyleSheet.create({
  cameraRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, copy: { flex: 1, gap: 4 }, heading: { gap: 5 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 5 }, number: { color: colors.primary, fontSize: 16, lineHeight: 24, fontWeight: '700', minWidth: 22 },
  name: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '600' }, badge: { color: colors.primary, fontSize: 14, lineHeight: 22, fontWeight: '700' }, error: { color: colors.danger, fontSize: 13, lineHeight: 21 },
});
