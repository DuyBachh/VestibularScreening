import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Easing, Linking, Modal, Platform, Pressable, ScrollView, Switch, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';
import { useCameraPermissions } from 'expo-camera';
import { SymbolView } from 'expo-symbols';
import { RunCamera } from './RunCamera';
import { cleanPendingTrialVideo } from '../../services/cameraTrialFiles';
import { useAuth } from '../auth/AuthProvider';
import { PatientPicker } from './PatientPicker';
import { SessionSave } from './SessionSave';
import { makeSessionId } from './sessionData';
import { runCapabilities } from '../demo/demoData';
import { DemoSessionNote } from '../demo/DemoSessionNote';
import { CameraTrial } from './CameraTrial';
import { TestPreparation } from './TestPreparation';
import { LearningFold } from '../guide/LearningUI';
import { SettingsRow } from '../settings/SettingsUI';
import { runPresentation } from './runPresentation';
import { testCatalog } from './catalog';
import { nextSaccadeCue } from './saccadeCue';
import { gazeCueAt } from './gazeCue';
import { oknMotionPlan } from './oknMotion';
import { CameraProblem, RunHeader, RunProgress, RunResult, RunStage, runScreenStyles } from './RunScreenUI';
import { useRunDraft } from './useRunDraft';

const DURATION = 30000;

/** @typedef {{ownerId: string, patient: import('../../services/patientDatabase').PatientRecord | null, camera: boolean, batteryId?: string, ordinal: number, label: string, last: boolean, persistResult: (result: import('./batteryFlow').BatteryResult, end: boolean) => Promise<void>, onFinish: (result: import('./batteryFlow').BatteryResult, end: boolean) => void}} BatteryRun */
/** @param {{ id: string, demo?: boolean, demoPatientName?: string, onDemoAdd?: (session: import('../demo/demoData').DemoSession) => void, battery?: BatteryRun }} props */
export function StimulusPlayer({ id, demo = false, demoPatientName = '', onDemoAdd = () => {}, battery }) {
  useLanguage();
  const auth = useAuth();
  const { ownerId, cameraAllowed } = runCapabilities({ demo, signedIn: auth.isSignedIn, userId: auth.session?.user.id });
  const draftStore = useRunDraft(auth.endingSession ? null : ownerId || null);
  const { prepare: prepareDraft, checkpoint, flush: flushDraft, discard: discardDraft, stop: stopDraft } = draftStore;
  const [runNotes, setRunNotes] = useState('');
  const notesRef = useRef('');
  const [starting, setStarting] = useState(false);
  const [draftActionError, setDraftActionError] = useState('');
  const startLock = useRef(false);
  const leaveLock = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showPreparation, setShowPreparation] = useState(false);
  const [selection, setSelection] = useState(/** @type {{ownerId: string, patient: import('../../services/patientDatabase').PatientRecord | null} | null} */ (null));
  const selectedPatient = battery ? battery.patient : selection && selection.ownerId === ownerId ? selection.patient : null;
  const [runInfo, setRunInfo] = useState(/** @type {{ id: string, ownerId: string, patientId: string | null, patientName: string, startedAt: string } | null} */ (null));
  const [endedAt, setEndedAt] = useState('');
  const [runSaved, setRunSaved] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [cameraEnabled, setWithCamera] = useState(false);
  const withCamera = cameraAllowed && (battery ? battery.camera : cameraEnabled);
  const [handoff, setHandoff] = useState(/** @type {{result: import('./batteryFlow').BatteryResult, end: boolean} | null} */ (null));
  const delivered = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [deletedSegments, setDeletedSegments] = useState(0);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [status, setStatus] = useState('ready');
  const [countdown, setCountdown] = useState(3);
  const [remaining, setRemaining] = useState(30);
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));
  const elapsed = useRef(0);
  const target = useRef(1);
  const saccadePosition = useRef(0);
  const saccadeWait = useRef(0);
  const pursuit = id === 'smooth-pursuit';

  useEffect(() => {
    const pause = () => setStatus((current) => ['running', 'countdown', 'preparing', 'arming'].includes(current) ? 'paused' : current);
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
      if (state !== 'active') { setCameraReady(false); pause(); }
    });
    const blur = AppState.addEventListener('blur', pause);
    return () => { subscription.remove(); blur.remove(); };
  }, []);

  useEffect(() => {
    if (status !== 'countdown') return;
    const started = Date.now();
    const timer = setInterval(() => {
      const left = Math.max(0, 3 - Math.floor((Date.now() - started) / 1000));
      setCountdown(left);
      if (!left) setStatus(withCamera ? 'arming' : 'running');
    }, 100);
    return () => clearInterval(timer);
  }, [status, withCamera]);

  useEffect(() => {
    if (status !== 'running') return;
    let active = true;
    const started = Date.now();
    const previous = elapsed.current;
    let lastTick = started;
    // Resume from the stopped position, keeping the same speed and direction.
    /** @param {number} from */
    const move = (from) => {
      if (!active) return;
      Animated.timing(position, {
        toValue: target.current, duration: Math.max(1, Math.abs(target.current - from) * 1500),
        easing: Easing.linear, useNativeDriver: true, isInteraction: false,
      }).start(({ finished }) => {
        if (active && finished) { const end = target.current; target.current *= -1; move(end); }
      });
    };
    if (pursuit) position.stopAnimation((value) => move(value));
    if (id === 'okn') {
      const plan = oknMotionPlan(previous);
      position.setValue(plan.start);
      Animated.sequence(plan.steps.map((step) => Animated.timing(position, { ...step, easing: Easing.linear, useNativeDriver: true, isInteraction: false }))).start();
    }
    const timer = setInterval(() => {
      const now = Date.now();
      elapsed.current = Math.min(DURATION, previous + now - started);
      setRemaining(Math.ceil((DURATION - elapsed.current) / 1000));
      if (id === 'gaze-evoked') {
        position.setValue(gazeCueAt(elapsed.current));
      } else if (!pursuit && id !== 'okn') {
        saccadeWait.current -= now - lastTick;
        if (saccadeWait.current <= 0) {
          saccadePosition.current = nextSaccadeCue(id, saccadePosition.current, Math.random());
          position.setValue(saccadePosition.current);
          saccadeWait.current = 600 + Math.random() * 600;
        }
      }
      lastTick = now;
      if (elapsed.current >= DURATION) { setEndedAt(new Date().toISOString()); setStatus('completed'); }
    }, 50);
    return () => {
      active = false;
      elapsed.current = Math.min(DURATION, previous + Date.now() - started);
      clearInterval(timer);
      position.stopAnimation();
    };
  }, [status, pursuit, position, id]);

  const onCameraReady = useCallback(/** @param {boolean} ready */ (ready) => {
    setCameraReady(ready);
    if (ready) setStatus((current) => current === 'preparing' ? 'countdown' : current);
  }, []);
  const onCameraProgress = useCallback(() => {
    setStatus((current) => current === 'arming' ? 'running' : current);
  }, []);
  const onCameraError = useCallback(/** @param {string} message */ (message) => {
    setCameraError(message);
    setStatus((current) => ['preparing', 'arming', 'running', 'countdown'].includes(current) ? 'paused' : current);
  }, []);
  const onDeleted = useCallback(() => setDeletedSegments((count) => count + 1), []);

  useEffect(() => {
    if (!['preparing', 'arming'].includes(status)) return;
    const timer = setTimeout(() => onCameraError(t("Camera chưa sẵn sàng. Hãy kết thúc lượt và kiểm tra lại camera.")), 10000);
    return () => clearTimeout(timer);
  }, [status, onCameraError]);

  async function start() {
    if (cameraBusy || startLock.current) return;
    startLock.current = true; setStarting(true); setDraftActionError('');
    try {
    if (battery && battery.ownerId !== (ownerId || '')) { setCameraError(t("Tài khoản đã thay đổi. Hãy kết thúc chuỗi và bắt đầu lại.")); return; }
    if (withCamera) {
      try {
        cleanPendingTrialVideo();
        const result = permission?.granted ? permission : await requestPermission();
        if (!result.granted) {
          Alert.alert(t("Chưa có quyền camera"), t("Bạn có thể tắt tùy chọn quay hoặc cấp quyền trong Cài đặt."), [
            { text: t("Đóng"), style: 'cancel' },
            { text: t("Mở Cài đặt"), onPress: () => { void Linking.openSettings().catch(() => setCameraError(t("Hãy mở quyền Camera trong Cài đặt thủ công."))); } },
          ]);
          return;
        }
      } catch { setCameraError(t("Không chuẩn bị được camera hoặc chưa dọn được video tạm. Hãy mở Thử camera trước để kiểm tra.")); return; }
    }
    const run = { id: makeSessionId(), ownerId: ownerId || '', patientId: selectedPatient?.id || null, patientName: demo ? demoPatientName : selectedPatient?.name || '', startedAt: new Date().toISOString() };
    if (ownerId) await prepareDraft({ ...run, testId: id, withCamera, ...(battery?.batteryId ? { batteryRef: { batteryId: battery.batteryId, ordinal: battery.ordinal } } : {}) });
    setRunInfo(run);
    notesRef.current = '';
    setRunNotes('');
    setEndedAt('');
    setRunSaved(false);
    setCameraError('');
    setDeletedSegments(0);

    elapsed.current = 0;
    target.current = 1;
    saccadePosition.current = 0;
    saccadeWait.current = 800;
    position.setValue(0);
    setRemaining(30);
    setCountdown(3);
    setCameraReady(false);
    setStatus(withCamera ? 'preparing' : 'countdown');
    } catch { setDraftActionError(t('Không tạo được bản nháp. Chưa bắt đầu bài; hãy thử lại.')); }
    finally { startLock.current = false; setStarting(false); }
  }

  function cancel() {
    if (ui.processing || savingSession) return;
    setStatus('paused');
    Alert.alert(t("Kết thúc lượt chạy?"), t("Lượt này sẽ được đánh dấu đã hủy. Sau khi camera xử lý xong, bạn có thể lưu thông tin và ghi chú."), [
      { text: t("Giữ tạm dừng"), style: 'cancel' },
      { text: t("Kết thúc lượt"), style: 'destructive', onPress: () => { setEndedAt(new Date().toISOString()); setStatus('cancelled'); } },
    ]);
  }

  /** @param {() => void} action */
  function leave(action) {
    if (savingSession || cameraBusy || leaveLock.current) return;
    if (runInfo?.ownerId && !runSaved && ['completed', 'cancelled'].includes(status)) {
      Alert.alert(t("Lượt kiểm tra chưa lưu"), t('Bỏ lượt sẽ xóa cả bản nháp và ghi chú chưa lưu. Bạn có thể ở lại để lưu vào lịch sử.') + (battery?.batteryId ? '\n\n' + t('Tổng hợp chuỗi vẫn giữ trạng thái và thời lượng; ghi chú đã bỏ không được khôi phục.') : ''), [
        { text: t("Ở lại để lưu"), style: 'cancel' }, { text: t("Bỏ lượt này"), style: 'destructive', onPress: () => {
          if (leaveLock.current) return;
          leaveLock.current = true; setSavingSession(true); setDraftActionError('');
          void discardDraft(runInfo.id).then(action).catch(() => setDraftActionError(t('Chưa xóa được bản nháp. Hãy thử lại.'))).finally(() => { leaveLock.current = false; setSavingSession(false); });
        } }, { text: t('Giữ bản nháp'), onPress: () => {
          if (leaveLock.current) return;
          leaveLock.current = true; setSavingSession(true);
          void flushDraft().then(action).catch(() => {}).finally(() => { leaveLock.current = false; setSavingSession(false); });
        } },
      ]);
    } else action();
  }

  const busy = ['running', 'paused', 'countdown', 'preparing', 'arming'].includes(status);
  const ui = runPresentation({ status, withCamera, cameraBusy, cameraError, foreground });
  const name = testCatalog.find((test) => test.id === id)?.name || t("Bài kiểm tra");
  const elapsedMs = status === 'completed' ? 30000 : (30 - remaining) * 1000;
  const checkpointRun = useCallback((/** @type {string} */ notes) => {
    if (!runInfo?.ownerId || runSaved || status === 'ready') return;
    checkpoint({ elapsedMs: status === 'completed' ? 30000 : Math.min(30000, Math.floor(elapsed.current)),
      status: ui.showResult ? status : 'active', endedAt: ui.showResult ? endedAt : '', notes,
      cameraStatus: !withCamera ? 'not_used' : cameraError ? 'error' : ui.showResult ? deletedSegments > 0 ? 'deleted' : 'not_used' : 'pending', deletedSegments });
  }, [runInfo, runSaved, status, endedAt, withCamera, cameraError, deletedSegments, ui.showResult, checkpoint]);
  useEffect(() => { checkpointRun(notesRef.current); }, [checkpointRun, remaining]);
  function changeRunNotes(/** @type {string} */ value) {
    notesRef.current = value; setRunNotes(value); checkpointRun(value);
  }
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (value) => { if (value !== 'active') void flushDraft().catch(() => {}); });
    return () => subscription.remove();
  }, [flushDraft]);
  function backToSetup() { setCameraReady(false); setStatus('ready'); }
  /** @param {boolean} end */
  async function finishInBattery(end) {
    if (!battery || !runInfo || !ui.showResult || cameraBusy || savingSession || delivered.current) return;
    const result = { testId: id, sessionId: runInfo.id, status, elapsedMs, saved: runSaved, cameraError: !!cameraError };
    setSavingSession(true); setDraftActionError('');
    try {
      await battery.persistResult(result, end);
      setHandoff({ result, end }); backToSetup();
    } catch { setDraftActionError(t('Chưa lưu được tiến độ chuỗi. Giữ màn này và thử tiếp tục hoặc kết thúc lại.')); }
    finally { setSavingSession(false); }
  }
  function confirmBatteryEnd() {
    if (cameraBusy || savingSession) return;
    Alert.alert(t("Kết thúc chuỗi?"), t("Các lượt đã lưu vẫn nằm trong Lịch sử. Các bài còn lại sẽ được ghi là chưa thực hiện trong bảng tổng hợp."), [
      { text: t("Ở lại"), style: 'cancel' }, { text: t("Kết thúc chuỗi"), style: 'destructive', onPress: () => leave(() => finishInBattery(true)) },
    ]);
  }
  function deliverHandoff() {
    if (!handoff || delivered.current || !battery) return;
    delivered.current = true;
    battery.onFinish(handoff.result, handoff.end);
  }
  useEffect(() => {
    if (Platform.OS === 'ios' || !handoff || delivered.current || !battery) return;
    delivered.current = true;
    battery.onFinish(handoff.result, handoff.end);
  }, [handoff, battery]);
  function resume() {
    if (!ui.canResume) return;
    if (withCamera) { setCountdown(3); setStatus(cameraReady ? 'countdown' : 'preparing'); }
    else if (elapsed.current === 0) { setCountdown(3); setStatus('countdown'); }
    else setStatus('running');
  }
  return <View style={styles.container}>
    {demo && status === 'ready' && !cameraOpen && !pickerOpen ? <TestPreparation id={id} demo compact /> : null}
    {demo ? <View style={styles.summary}>
      <Text style={styles.badge}>{demo ? t("DỮ LIỆU MÔ PHỎNG - DEMO") : t("MÔ PHỎNG HỌC TẬP")}</Text>
      <Text style={styles.summaryTitle}>{demo ? t("Sẵn sàng chạy thử?") : t("2 · Thiết lập lượt chạy")}</Text>
      <Text style={styles.body}>{t("30 giây thực hiện · 3 giây chuẩn bị")}</Text>
      <Text style={styles.body}>{t("Bệnh nhân: ")}{demo ? demoPatientName : selectedPatient ? `${selectedPatient.name} · ${selectedPatient.code}` : t("Không gắn hồ sơ")}</Text>
      {ownerId ? <Button secondary onPress={() => setPickerOpen(true)}>{t("Chọn / đổi bệnh nhân")}</Button> : <Text style={styles.hint}>{demo ? t("Demo không ghi dữ liệu vào tài khoản.") : t("Chế độ xem trước không lưu lịch sử. Đăng nhập để lưu lượt chạy.")}</Text>}
      {cameraAllowed && Platform.OS !== 'web' ? <View style={styles.cameraOption}>
        <Text style={[styles.body, { flex: 1 }]}>{t("Quay camera trong bài")}{'\n'}<Text style={{ fontSize: 14 }}>{t("Không thu âm · Tự xóa video")}</Text></Text>
        <Switch accessibilityLabel={t("Quay camera trong bài")} value={withCamera} onValueChange={setWithCamera} />
      </View> : null}
      {cameraError ? <Text accessibilityRole="alert" style={styles.error}>{cameraError}</Text> : null}
      <Button loading={starting} disabled={cameraBusy} onPress={() => { void start(); }}>{t("Bắt đầu bài kiểm tra →")}</Button>
      {cameraAllowed ? <Button secondary onPress={() => setCameraOpen(true)}>{t("Thử camera trước")}</Button> : null}
    </View> : <View style={styles.setup}>
      <View style={styles.facts}><Text style={styles.factPill}>{t("3 giây chuẩn bị")}</Text><Text style={styles.factPill}>{t("30 giây thực hiện")}</Text></View>
      {status === 'ready' && !cameraOpen && !pickerOpen ? <LearningFold title={t("Cách thực hiện")} summary={t("Xem hướng dẫn và chuyển động mẫu")} expanded={showPreparation} onPress={() => setShowPreparation((value) => !value)}><TestPreparation id={id} compact embedded /></LearningFold> : null}
      {battery ? <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{battery.label}</Text><Text style={styles.intro}>{selectedPatient?.name || t("Không gắn hồ sơ")} · Camera {withCamera ? t("bật") : t("tắt")}</Text><Text style={styles.cameraHint}>{t("Thiết lập dùng chung cả chuỗi. Sau mỗi bài, lưu lượt hoặc xác nhận bỏ trước khi tiếp tục.")}</Text>{withCamera ? <Button secondary onPress={() => setCameraOpen(true)}>{t("Xem trước camera")}</Button> : null}</View> : <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>{t("Hồ sơ · Không bắt buộc")}</Text>
        {ownerId ? <View style={styles.pickerRow}><SettingsRow title={selectedPatient?.name || t("Không gắn hồ sơ")} subtitle={selectedPatient ? t("{0} · Chạm để đổi lựa chọn", [selectedPatient.code]) : t("Chạm để chọn hồ sơ mẫu")} onPress={() => setPickerOpen(true)} /></View> : <Text style={styles.intro}>{t("Bạn đang xem trước, lượt chạy không lưu vào lịch sử. Đăng nhập để chọn hồ sơ và lưu phiên.")}</Text>}
      </View>}
      {!battery && cameraAllowed && Platform.OS !== 'web' ? <View style={styles.cameraBox}>
        <View style={styles.cameraOption}><View style={styles.cameraText}><Text style={styles.fieldLabel}>{t("Quay camera trong bài")}</Text><Text style={styles.cameraHint}>{withCamera ? t("Đang bật") : t("Đang tắt · Không bắt buộc")}</Text></View><Switch accessibilityLabel={t("Quay camera trong bài")} value={withCamera} onValueChange={setWithCamera} /></View>
        {withCamera ? <Pressable accessibilityRole="button" accessibilityLabel={t("Mở xem trước camera")} onPress={() => setCameraOpen(true)} style={({ pressed }) => [styles.previewLink, pressed && { opacity: 0.7 }]}><SymbolView name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }} size={28} tintColor="#6C8194" style={{ width: 28, height: 28 }} /><Text style={styles.previewTitle}>{t("Xem trước camera")}</Text><Text style={styles.cameraHint}>{t("Chạm để mở cửa sổ thử camera")}</Text></Pressable> : null}
        <Text style={styles.cameraHint}>{withCamera ? t("Camera chỉ mở khi bạn xem trước hoặc bắt đầu lượt.") : t("Bật nếu muốn ghi cùng lượt chạy. Vẫn có thể chạy khi tắt camera.")}</Text>
        {withCamera ? <Text style={styles.cameraHint}>{t("Không thu âm · Video tạm tự xóa khi dừng.")}</Text> : null}
        {!withCamera ? <Pressable accessibilityRole="button" onPress={() => setCameraOpen(true)} style={styles.cameraLink}><Text style={styles.cameraLinkText}>{t("Thử camera trước khi chạy ›")}</Text></Pressable> : null}
      </View> : null}
      <Text style={styles.cameraHint}>{t("Giữ điện thoại ổn định và đầu cố định. Có thể tạm dừng bất kỳ lúc nào; dừng nếu thấy khó chịu.")}</Text>
      {cameraError ? <Text accessibilityRole="alert" style={styles.error}>{cameraError}</Text> : null}
      <Button loading={starting} disabled={cameraBusy} onPress={() => { void start(); }}>{t("Bắt đầu bài kiểm tra")}</Button>
      <Text style={styles.setupFootnote}>{t("Mô phỏng học tập · Chưa đo chỉ số mắt.")}</Text>
    </View>}
    {draftActionError ? <Text accessibilityRole="alert" style={styles.error}>{draftActionError}</Text> : null}
    {pickerOpen && ownerId ? <PatientPicker key={ownerId} ownerId={ownerId} onClose={() => setPickerOpen(false)} onSelect={(patient) => { setSelection({ ownerId, patient }); setPickerOpen(false); }} /> : null}
    {cameraOpen ? <CameraTrial onClose={() => setCameraOpen(false)} /> : null}
    <Modal visible={status !== 'ready'} presentationStyle="fullScreen" animationType="none" onRequestClose={() => {
      if (savingSession || ui.processing) return;
      if (busy) cancel(); else if (battery) confirmBatteryEnd(); else leave(backToSetup);
    }} onDismiss={deliverHandoff}>
      <SafeAreaProvider><SafeAreaView style={runScreenStyles.safe}>
        <ScrollView contentContainerStyle={runScreenStyles.content} bounces={false} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
          {battery ? <Text style={styles.fieldLabel}>{battery.label}</Text> : null}
          <RunHeader name={name} id={id} patientName={runInfo?.patientName || ''} demo={demo} />
          {withCamera ? <RunCamera active={status === 'arming' || status === 'running'} confirmed={status === 'running'}
            visible={foreground && (busy || cameraBusy)} show={!ui.terminal || cameraBusy} phase={ui.cameraPhase} deletedSegments={deletedSegments}
            onReady={onCameraReady} onProgress={onCameraProgress} onBusy={setCameraBusy} onError={onCameraError} onDeleted={onDeleted} /> : null}
          {ui.showResult ? <>
            <RunResult status={status} elapsedMs={elapsedMs} patientName={runInfo?.patientName || ''} withCamera={withCamera} cameraError={cameraError} deletedSegments={deletedSegments} />
            {demo && runInfo ? <DemoSessionNote key={runInfo.id} onAdd={onDemoAdd}
              session={{ id: runInfo.id, patientName: demoPatientName, testId: id, status, elapsedMs, notes: '' }} /> : null}
            {runInfo?.ownerId ? <SessionSave key={runInfo.id} embedded ownerId={runInfo.ownerId} patientName={runInfo.patientName}
              notes={runNotes} onNotesChange={changeRunNotes} onSaved={() => { stopDraft(); setRunSaved(true); }} onSaving={setSavingSession}
              draft={{ id: runInfo.id, patientId: runInfo.patientId, testId: id, startedAt: runInfo.startedAt, endedAt,
                elapsedMs, status, cameraStatus: !withCamera ? 'not_used' : cameraError ? 'error' : deletedSegments > 0 ? 'deleted' : 'not_used', deletedSegments }} />
              : !demo ? <Text style={runScreenStyles.small}>{t("Chế độ xem trước không lưu lịch sử. Đăng nhập để lưu lượt kiểm tra.")}</Text> : null}
            <View style={runScreenStyles.resultControls}>
              {battery ? <><Button disabled={cameraBusy || savingSession || !!handoff} onPress={() => leave(() => finishInBattery(false))}>{battery.last ? t("Xem tổng hợp") : t("Tiếp tục chuỗi")}</Button><Button secondary disabled={cameraBusy || savingSession || !!handoff} onPress={confirmBatteryEnd}>{t("Kết thúc chuỗi")}</Button></> : <><Button secondary disabled={cameraBusy || savingSession || !!cameraError} onPress={() => leave(() => { void start(); })}>{t("Chạy lại")}</Button>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: cameraBusy || savingSession }} disabled={cameraBusy || savingSession}
                style={runScreenStyles.exit} onPress={() => leave(backToSetup)}>
                <Text style={runScreenStyles.exitText}>{demo ? t("Về Demo") : t("Về thông tin bài")}</Text>
              </Pressable></>}
            </View>
          </> : <>
            <RunProgress title={ui.title} remaining={remaining} withCamera={withCamera} />
            {ui.showError ? <CameraProblem message={cameraError} /> : <RunStage id={id} status={status} countdown={countdown} processing={ui.processing} position={position} width={width} onWidth={setWidth} />}
            {ui.showError ? <Button secondary disabled={!ui.canEnd} onPress={cancel}>{t("Kết thúc lượt chạy")}</Button> : <View style={runScreenStyles.controls}>
              <View style={runScreenStyles.control}><Button disabled={ui.processing || (status === 'paused' && !ui.canResume)}
                onPress={status === 'paused' ? resume : () => setStatus('paused')}>{ui.processing ? t("Đang xử lý…") : status === 'paused' ? t("Tiếp tục") : t("Tạm dừng")}</Button></View>
              <View style={runScreenStyles.control}><Button secondary disabled={!ui.canEnd} onPress={cancel}>{t("Kết thúc")}</Button></View>
            </View>}
          </>}
          {draftActionError ? <Text accessibilityRole="alert" style={styles.error}>{draftActionError}</Text> : null}
          {runInfo?.ownerId && !runSaved && draftStore.state !== 'idle' ? <View><Text accessibilityLiveRegion={ui.showResult ? 'polite' : 'none'} style={draftStore.state === 'error' ? styles.error : styles.hint}>{draftStore.state === 'error' ? t('Chưa lưu được bản nháp mới nhất. Đừng đóng ứng dụng; hãy thử lại hoặc lưu vào lịch sử.') : draftStore.state === 'saving' ? t('Đang lưu bản nháp…') : t('Đã lưu bản nháp trên thiết bị')}</Text>{draftStore.state === 'error' ? <Button secondary onPress={() => { void flushDraft().catch(() => {}); }}>{t('Thử lưu bản nháp lại')}</Button> : null}</View> : null}
          <Text style={runScreenStyles.footer}>{demo ? t("Dữ liệu mô phỏng · Demo không lưu vào tài khoản.") : t("Nguyên mẫu học tập · Không dùng để chẩn đoán.")}</Text>
        </ScrollView>
      </SafeAreaView></SafeAreaProvider>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  setup: { gap: 18 }, facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, factPill: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 9, backgroundColor: colors.tint, color: colors.muted, fontSize: 13, lineHeight: 21 },
  fieldGroup: { gap: 9 }, fieldLabel: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: '600' }, pickerRow: { borderRadius: 14, borderWidth: 1, borderColor: '#DCE4EB', overflow: 'hidden' },
  cameraBox: { padding: 16, gap: 12, borderRadius: 17, borderWidth: 1, borderColor: '#DCE4EB', backgroundColor: '#FFFFFF' }, cameraText: { flex: 1, gap: 3 }, cameraHint: { color: colors.muted, fontSize: 13, lineHeight: 21 }, cameraLink: { minHeight: 44, justifyContent: 'center', paddingVertical: 8 }, cameraLinkText: { color: colors.primary, fontSize: 14, lineHeight: 22, fontWeight: '600' }, setupFootnote: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: -7 },
  previewLink: { minHeight: 132, padding: 16, gap: 7, backgroundColor: '#E7EDF2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, previewTitle: { color: colors.primary, fontSize: 14, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
  cameraOption: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  error: { color: colors.danger, fontSize: 15, lineHeight: 23 },
  summary: { padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 16 },
  summaryTitle: { color: colors.text, fontSize: 23, fontWeight: '700' },
  badge: { color: colors.primary, fontSize: 12, lineHeight: 19, fontWeight: '700', letterSpacing: 0.5 },
  hint: { color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  body: { color: colors.muted, fontSize: 16, lineHeight: 25 },
});
