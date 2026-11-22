import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';
import { useLanguage } from '../language/LanguageProvider';
import { t } from '../language/language.js';
import { analyzeEyeTrace, exampleEyeTrace, TRACE_HEADER, TRACE_MAX_LENGTH } from './eyeTrace.js';
import { traceErrorMessage, traceEventReason, traceMethodDescription, traceMetricRows, traceNumber } from './analysisPresentation.js';
import { TraceChart } from './TraceChart';
import { buildTraceReport } from './traceReport.js';
import { exportTraceReport } from '../../services/traceReportExport';
import { LearningFold } from '../guide/LearningUI';

export function AnalysisScreen() {
  const language = useLanguage();
  const [mode, setMode] = useState(/** @type {'pursuit' | 'saccades'} */ ('pursuit'));
  const [csv, setCsv] = useState('');
  const [sample, setSample] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [result, setResult] = useState(/** @type {ReturnType<typeof analyzeEyeTrace> | null} */ (null));
  const current = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => { current.current++; return () => { current.current++; }; }, []));

  /** @param {() => void} action */
  function replaceData(action) {
    if (csv && !sample) Alert.alert(t('Thay dữ liệu đang nhập?'), t('Dữ liệu chỉ nằm trong màn này. Thay dữ liệu sẽ bỏ nội dung và kết quả hiện tại.'), [
      { text: t('Ở lại'), style: 'cancel' }, { text: t('Thay dữ liệu'), style: 'destructive', onPress: action },
    ]);
    else action();
  }
  /** @param {'pursuit' | 'saccades'} next */
  function changeMode(next) {
    if (next === mode || busy) return;
    replaceData(() => { setMode(next); setCsv(''); setSample(false); setConfirmed(false); setResult(null); setError(''); });
  }
  function loadExample() {
    replaceData(() => {
      const data = exampleEyeTrace(mode);
      setCsv(data); setSample(true); setConfirmed(false); setShowInput(false); setError('');
      setResult(analyzeEyeTrace(data, mode));
    });
  }
  function analyze() {
    setResult(null); setError('');
    if (!sample && !confirmed) return;
    try { setResult(analyzeEyeTrace(csv, mode)); setShowInput(false); }
    catch (problem) { setError(traceErrorMessage(problem)); }
  }
  async function exportPdf() {
    if (!result || busy) return;
    const html = buildTraceReport({ analysis: result, sample, generatedAt: new Date(), language, metrics: traceMetricRows(result), method: traceMethodDescription() });
    const generation = current.current;
    const isCurrent = () => mounted.current && current.current === generation;
    setBusy(true); setError('');
    try { await exportTraceReport(html, isCurrent); }
    catch { if (isCurrent()) setError(t('Không xuất được PDF. Hãy thử lại trên điện thoại.')); }
    finally { if (mounted.current) setBusy(false); }
  }
  function clear() {
    Alert.alert(t('Xóa dữ liệu phân tích?'), t('Chỉ xóa nội dung trên màn này. Hồ sơ và lịch sử kiểm tra không thay đổi.'), [
      { text: t('Ở lại'), style: 'cancel' },
      { text: t('Xóa'), style: 'destructive', onPress: () => { setCsv(''); setSample(false); setConfirmed(false); setResult(null); setError(''); setShowInput(false); } },
    ]);
  }
  return <Screen title={t('Phân tích dữ liệu mắt')} subtitle={t('Thử thuật toán bằng số đo nhập vào. Không cần camera hoặc kết nối mạng.')}>
    <View style={styles.card}>
      <Text style={styles.heading}>{t('1 · Chọn dạng dữ liệu')}</Text>
      <View style={styles.modes}>{(['pursuit', 'saccades']).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: mode === value, disabled: busy }} disabled={busy} onPress={() => changeMode(/** @type {'pursuit' | 'saccades'} */ (value))} style={[styles.mode, mode === value && styles.selected]}><Text style={[styles.modeText, mode === value && styles.selectedText]}>{value === 'pursuit' ? 'Smooth Pursuit' : 'Saccades'}</Text></Pressable>)}</View>
      <Text style={styles.body}>{t('Chỉ phục vụ nghiên cứu thuật toán. Không dùng để phân loại bình thường/bất thường hoặc chẩn đoán. Ứng dụng chưa theo dõi đồng tử từ camera.')}</Text>
      <Button secondary disabled={busy} onPress={loadExample}>{t('Thử dữ liệu mẫu có đáp án')}</Button>
      <Button secondary disabled={busy} onPress={() => setShowInput((value) => !value)}>{showInput ? t('Thu gọn CSV') : t('Nhập hoặc xem CSV')}</Button>
    </View>
    {showInput ? <View style={styles.card}>
      <Text style={styles.heading}>{t('2 · Dán dữ liệu CSV')}</Text>
      <Text style={styles.body}>{t('Một trục góc đã hiệu chỉnh bên ngoài: thời gian (ms), góc mắt (°), góc mục tiêu (°), valid (0/1). valid=0 là mất mẫu; eye_deg được để trống. Chỉ dùng dữ liệu giả lập hoặc dữ liệu nghiên cứu được phép sử dụng.')}</Text>
      <Text selectable style={styles.code}>{TRACE_HEADER}</Text>
      <TextInput accessibilityLabel={t('Nội dung CSV chuyển động mắt')} multiline textAlignVertical="top" autoCorrect={false} autoCapitalize="none" spellCheck={false} maxLength={TRACE_MAX_LENGTH + 1} editable={!busy} value={csv} placeholder={`${TRACE_HEADER}\n0,0,0,1\n10,0,0,1\n…`} placeholderTextColor={colors.placeholder} style={styles.input}
        onChangeText={(value) => { setCsv(value); setSample(false); setConfirmed(false); setResult(null); setError(''); }} />
      <View style={styles.confirm}><Switch disabled={busy || sample} value={sample || confirmed} onValueChange={setConfirmed} accessibilityLabel={t('Xác nhận dữ liệu góc đã hiệu chỉnh')} /><Text style={styles.confirmText}>{t('Tôi xác nhận đơn vị là độ, thời gian là ms; nguồn đo đã được hiệu chỉnh bên ngoài. Ứng dụng không xác minh được việc hiệu chỉnh này.')}</Text></View>
      <Button disabled={busy || !csv || (!sample && !confirmed)} onPress={analyze}>{t('Phân tích dữ liệu')}</Button>
    </View> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {result ? <>
      <View style={styles.card}>
        <Text style={styles.tag}>{sample ? t('DỮ LIỆU MÔ PHỎNG · DEMO') : t('DỮ LIỆU NHẬP · CHƯA KIỂM CHỨNG NGUỒN ĐO')}</Text>
        <Text style={styles.heading}>{t('Kiểm tra dữ liệu đầu vào')}</Text>
        <Text style={styles.body}>{t('{0} mẫu · {1} Hz trung vị · {2}% mẫu hợp lệ · khoảng mất mẫu lớn nhất {3} ms', [result.quality.sampleCount, traceNumber(result.quality.sampleHz, 1), traceNumber(result.quality.validRatio * 100, 1), traceNumber(result.quality.maxGapMs, 0)])}</Text>
        <Text style={styles.body}>{result.quality.ready ? t('Đạt điều kiện tính toán của thuật toán, không xác nhận chất lượng tracking lâm sàng.') : t('Dữ liệu không đủ điều kiện tính toán. Chỉ hiển thị đồ thị; không suy ra chỉ số.')}</Text>
        <TraceChart samples={result.samples} />
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>{t('Chỉ số tính từ dữ liệu nhập')}</Text>
        {traceMetricRows(result).map((metric) => <View style={styles.metric} key={metric.label}><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricValue}>{metric.value} {metric.unit}</Text></View>)}
        {sample ? <Text style={styles.body}>{mode === 'pursuit' ? t('Đáp án mẫu: gain vận tốc 0,80. Đây là dữ liệu tạo bằng công thức, không phải số đo bệnh nhân.') : t('Đáp án mẫu: 2 đáp ứng, độ trễ 200 ms, vận tốc đỉnh trung bình 187,5°/s, gain biên độ 1,00. Không phải số đo bệnh nhân.')}</Text> : null}
        {result.events.length ? <LearningFold title={t('Chi tiết từng bước mục tiêu')} summary={t('Đáp ứng và lý do loại khỏi phép tính')} expanded={showEvents} onPress={() => setShowEvents((value) => !value)}>
          {result.events.slice(0, 30).map((event, i) => <View key={event.timeMs} style={styles.event}><Text style={styles.body}>{t('Bước {0} · {1} ms', [i + 1, traceNumber(event.timeMs, 0)])}</Text><Text style={styles.body}>{event.reason ? traceEventReason(event.reason) : t('Độ trễ {0} ms · đỉnh {1}°/s · gain {2}', [traceNumber(event.latencyMs, 0), traceNumber(event.peakVelocity, 1), traceNumber(event.displacementGain)])}</Text></View>)}
          {result.events.length > 30 ? <Text style={styles.body}>{t('Hiển thị 30 bước đầu; chỉ số tổng hợp dùng toàn bộ bước đủ điều kiện.')}</Text> : null}
        </LearningFold> : null}
        <Button loading={busy} onPress={() => { void exportPdf(); }}>{t('Xuất báo cáo phân tích PDF')}</Button>
      </View>
    </> : null}
    <LearningFold title={t('Phương pháp và giới hạn')} summary={t('Đọc trước khi dùng dữ liệu riêng')} expanded={showMethod} onPress={() => setShowMethod((value) => !value)}>
      <Text style={styles.body}>{traceMethodDescription()}</Text>
      <Text style={styles.body}>{t('Điều kiện tính: tần số trung vị ≥20 Hz, ít nhất 80% mẫu hợp lệ, không có khoảng mất mẫu trên 250 ms. Không tính vận tốc qua khoảng mẫu trên 100 ms. Đây là điều kiện kỹ thuật, không chứng nhận chất lượng tín hiệu.')}</Text>
      <Text style={styles.body}>{t('Chỉ số dùng một trục góc đã được hiệu chỉnh bên ngoài, không đổi pixel thành độ. Không lọc bandpass, không bù chớp mắt, không ước tính SPV hoặc NPC. Vận tốc đỉnh phụ thuộc tần số lấy mẫu; độ trễ có sai số lượng tử theo khoảng mẫu. Dấu — nghĩa là không đủ dữ liệu, không phải kết quả bằng 0.')}</Text>
      <Text style={styles.body}>{t('Nội dung CSV và kết quả chỉ giữ trong bộ nhớ màn này; không ghi lịch sử tài khoản, không tự tải lên máy chủ. PDF chỉ được chia sẻ khi bạn chọn đích.')}</Text>
    </LearningFold>
    {csv ? <Button secondary disabled={busy} onPress={clear}>{t('Xóa dữ liệu phân tích')}</Button> : null}
  </Screen>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#DCE4EB', padding: 17, gap: 14 }, heading: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 22, color: colors.muted }, tag: { color: colors.primary, fontWeight: '700', fontSize: 12, lineHeight: 20 }, modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: { flexGrow: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, padding: 13, minHeight: 48 }, selected: { backgroundColor: colors.primary }, modeText: { color: colors.primary, textAlign: 'center', fontWeight: '600', fontSize: 15 }, selectedText: { color: '#FFFFFF' },
  input: { height: 190, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, backgroundColor: '#F7FAFC' }, code: { color: colors.primary, fontSize: 12, lineHeight: 19 },
  confirm: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, confirmText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 21 }, error: { color: colors.danger, lineHeight: 23, fontSize: 15 },
  metric: { gap: 5, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }, metricLabel: { color: colors.muted, fontSize: 14, lineHeight: 22 }, metricValue: { color: colors.text, fontWeight: '700', fontSize: 25, lineHeight: 33, fontVariant: ['tabular-nums'] },
  event: { paddingVertical: 10, gap: 3, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
});
