import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';
import { useLanguage } from '../language/LanguageProvider';
import { t, getLocale } from '../language/language.js';
import { batteryDatabase } from '../../services/batteryDatabase';
import { batteryItemSource, batteryItemStatus, recordedBatteryCounts } from './batteryRecord';
import { supportedTests } from './catalog';
import { SessionReportActions } from './SessionReportActions';

/** @param {{ownerId: string,patientId?: string}} props */
export function BatteryHistoryScreen({ ownerId, patientId = '' }) {
  useLanguage();
  const [items, setItems] = useState(/** @type {import('../../services/batteryRepository').BatteryRow[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const sequence = useRef(0);
  const lock = useRef(false);
  const load = useCallback(async (offset = 0) => {
    if (lock.current) return;
    lock.current = true; const token = ++sequence.current;
    setLoading(true); setError('');
    try {
      const rows = await batteryDatabase.list(ownerId, patientId || null, offset);
      if (token !== sequence.current) return;
      setItems((old) => offset ? [...old, ...rows] : rows); setHasMore(rows.length === 30);
    } catch { if (token === sequence.current) setError(t('Không tải được lịch sử chuỗi. Hãy thử lại.')); }
    finally { if (token === sequence.current) { lock.current = false; setLoading(false); } }
  }, [ownerId, patientId]);
  useFocusEffect(useCallback(() => { void load(); return () => { sequence.current++; lock.current = false; }; }, [load]));
  return <Screen title={t('Lịch sử chuỗi 6 bài')} subtitle={t('Mở lại tổng hợp đã ghi và xuất một PDF chung.')}>
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {!items.length && !loading && !error ? <Text style={styles.body}>{t('Chưa có chuỗi được lưu từ bản cập nhật này. Các lượt riêng trước đây không được tự ghép thành chuỗi.')}</Text> : null}
    {items.map((item) => <View key={item.id} style={styles.card}>
      <Text style={styles.title}>{item.patient_name || t('Không gắn hồ sơ')}</Text><Text style={styles.body}>{new Date(item.created_at).toLocaleString(getLocale())}</Text>
      <Text style={styles.body}>{item.ended_at ? t('Đã ghi nhận kết thúc chuỗi') : t('Chưa xác nhận kết thúc chuỗi')}</Text><Text style={styles.status}>{t('{0}/6 lượt đã lưu vào lịch sử', [item.saved_count || 0])}</Text>
      <Button secondary disabled={loading} onPress={() => router.push({ pathname: '/battery-results/[id]', params: { id: item.id } })}>{t('Xem tổng hợp chuỗi')}</Button>
    </View>)}
    {hasMore ? <Button secondary disabled={loading} onPress={() => { void load(items.length); }}>{t('Tải thêm')}</Button> : null}
    <Button secondary disabled={loading} onPress={() => { void load(); }}>{t('Tải lại danh sách')}</Button>
    <Button secondary disabled={loading} onPress={() => router.push('/battery')}>{t('Chuẩn bị chuỗi mới')}</Button>
  </Screen>;
}

/** @param {{ownerId: string,id: string}} props */
export function BatteryResultsScreen({ ownerId, id }) {
  useLanguage();
  const [record, setRecord] = useState(/** @type {import('../../services/batteryRepository').RecordedBattery | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const token = ++sequence.current; setLoading(true); setError('');
    try {
      const next = await batteryDatabase.get(ownerId, id);
      if (token !== sequence.current) return;
      setRecord(next);
      if (!next) setError(t('Chuỗi không còn tồn tại hoặc hồ sơ đã thay đổi.'));
    } catch { if (token === sequence.current) { setRecord(null); setError(t('Không tải được tổng hợp chuỗi. Hãy thử lại.')); } }
    finally { if (token === sequence.current) setLoading(false); }
  }, [ownerId, id]);
  useFocusEffect(useCallback(() => { void load(); return () => { sequence.current++; }; }, [load]));
  const counts = record ? recordedBatteryCounts(record.items) : null;
  return <Screen title={t('Tổng hợp chuỗi đã lưu')} subtitle={record?.patient_name || t('Không gắn hồ sơ')}>
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {record && counts && !loading ? <>
      <View style={styles.card}><Text style={styles.title}>{record.ended_at ? t('Đã ghi nhận kết thúc chuỗi') : t('Chưa xác nhận kết thúc chuỗi')}</Text><Text selectable style={styles.body}>{t('Mã chuỗi')}: {record.id}</Text><Text style={styles.body}>{new Date(record.created_at).toLocaleString(getLocale())}</Text>
        <Text style={styles.body}>{t('{0} hoàn tất · {1} đã hủy · {2} gián đoạn · {3} chưa thực hiện', [counts.completed, counts.cancelled, counts.interrupted, counts.remaining])}</Text><Text style={styles.status}>{t('{0}/6 lượt đã lưu vào lịch sử', [counts.saved])}</Text>
        <Text style={styles.body}>{t('Lượt còn bản nháp được ghi rõ là chưa lưu lịch sử. Khi bỏ lượt hoặc xóa bản nháp, tổng hợp chỉ giữ trạng thái/thời lượng đã xác nhận, không giữ lại ghi chú đã bỏ.')}</Text>
      </View>
      {record.items.map((item, index) => <View key={item.testId} style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{index + 1}. {supportedTests.find((test) => test.id === item.testId)?.name || item.testId}</Text>
        <Text style={styles.status}>{batteryItemStatus(item.status)}</Text><Text style={styles.body}>{batteryItemSource(item.source)}</Text>
        {item.elapsedMs !== null ? <Text style={styles.body}>{t('Thời gian thực hiện')}: {(item.elapsedMs / 1000).toFixed(1)} s</Text> : null}
        {item.status === 'interrupted' ? <Text style={styles.body}>{t('Thời lượng của lượt gián đoạn là mốc cuối đã ghi, không phải thời gian hoàn tất.')}</Text> : null}
        {item.cameraStatus === 'error' ? <Text style={styles.error}>{t('Có lỗi camera')}</Text> : null}
        <Text style={styles.note}>{item.notes || (item.source === 'discarded' || item.source === 'missing' ? t('Ghi chú đã bỏ không được giữ trong tổng hợp.') : t('Không có ghi chú.'))}</Text>
        {item.source === 'saved' && item.sessionId ? <Button secondary onPress={() => router.push({ pathname: '/sessions/[id]', params: { id: item.sessionId || '' } })}>{t('Mở lượt đã lưu')}</Button> : null}
      </View>)}
      {record.items.some((item) => item.source === 'draft') ? <Button secondary onPress={() => router.push('/drafts')}>{t('Mở bản nháp chưa lưu')}</Button> : null}
      <SessionReportActions ownerId={ownerId} batteryId={id} notesDirty={false} saving={loading} />
      <Text style={styles.body}>{t('Hồ sơ, ghi chú và thông tin người lập được đọc theo dữ liệu hiện tại. Bản PDF đã xuất trước đó không tự thay đổi.')}</Text>
    </> : null}
    <Button secondary disabled={loading} onPress={() => { void load(); }}>{t('Tải lại')}</Button>
  </Screen>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#DCE4EB', borderRadius: 18, padding: 17, gap: 10 }, title: { color: colors.text, fontWeight: '700', fontSize: 18, lineHeight: 26 }, body: { color: colors.muted, fontSize: 14, lineHeight: 22 }, status: { color: colors.primary, fontSize: 14, fontWeight: '600', lineHeight: 22 }, note: { color: colors.text, fontSize: 15, lineHeight: 24 }, error: { color: colors.danger, fontSize: 14, lineHeight: 22 },
});
