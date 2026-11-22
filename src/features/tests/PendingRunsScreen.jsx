import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { SettingsRow } from '../settings/SettingsUI';
import { colors } from '../../constants/theme';
import { pendingRuns } from '../../services/pendingRunDatabase';
import { pendingCheckpoint } from '../../services/pendingRunRepository';
import { createPendingWriter } from './pendingWriter';
import { useAuth } from '../auth/AuthProvider';
import { t, getLocale } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { testName } from './SessionHistoryScreen';

/** @param {string} status */
export function pendingStatus(status) {
  return status === 'completed' ? t('Hoàn tất · Chưa lưu lịch sử') : status === 'cancelled' ? t('Đã hủy · Chưa lưu lịch sử') : t('Gián đoạn · Không phải kết quả hoàn tất');
}
/** @param {{ownerId: string}} props */
export function DraftNotice({ ownerId }) {
  useLanguage();
  const [count, setCount] = useState(0);
  const [failed, setFailed] = useState(false);
  useFocusEffect(useCallback(() => {
    let live = true;
    void pendingRuns.count(ownerId).then((value) => { if (live) { setCount(value); setFailed(false); } }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [ownerId]));
  if (!count && !failed) return null;
  return <View style={styles.panel}>
    <Text style={styles.title}>{t('Bản nháp chưa lưu')}</Text>
    <Text style={styles.body}>{failed ? t('Chưa đọc được bản nháp. Mở danh sách để thử lại.') : t('Có {0} lượt chưa lưu vào lịch sử. Khôi phục để xem lại hoặc chọn xóa bản nháp.', [count])}</Text>
    <Button secondary onPress={() => router.push('/drafts')}>{t('Xem và khôi phục')}</Button>
  </View>;
}
/** @param {{ownerId: string}} props */
export function PendingRunsScreen({ ownerId }) {
  useLanguage();
  const [rows, setRows] = useState(/** @type {import('../../services/pendingRunRepository').PendingRun[]} */ ([]));
  const [selected, setSelected] = useState(/** @type {import('../../services/pendingRunRepository').PendingRun | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const sequence = useRef(0);
  const load = useCallback(async (offset = 0) => {
    const token = ++sequence.current;
    setLoading(true); setError('');
    try {
      const items = await pendingRuns.list(ownerId, offset);
      if (token !== sequence.current) return;
      setRows((previous) => offset ? [...previous, ...items] : items); setHasMore(items.length === 30);
    } catch { if (token === sequence.current) setError(t('Không tải được bản nháp. Hãy thử lại.')); }
    finally { if (token === sequence.current) setLoading(false); }
  }, [ownerId]);
  useFocusEffect(useCallback(() => { void load(); return () => { sequence.current++; }; }, [load]));
  async function open(/** @type {string} */ id) {
    if (loading) return;
    const token = ++sequence.current; setLoading(true); setError('');
    try {
      const row = await pendingRuns.get(ownerId, id);
      if (token !== sequence.current) return;
      if (!row) { setError(t('Bản nháp không còn tồn tại hoặc hồ sơ đã thay đổi.')); return; }
      setSelected(row);
    } catch { if (token === sequence.current) setError(t('Không tải được bản nháp. Hãy thử lại.')); }
    finally { if (token === sequence.current) setLoading(false); }
  }
  if (selected) return <RecoveredEditor key={selected.id} row={selected} ownerId={ownerId} onBack={() => { setSelected(null); void load(); }} />;
  return <Screen title={t('Bản nháp chưa lưu')} subtitle={t('Kết quả và ghi chú lưu tạm trên thiết bị, riêng theo tài khoản. Không có video.')}>
    <Text style={styles.body}>{t('Lượt đã hoàn tất hoặc đã hủy có thể lưu tiếp vào lịch sử. Lượt gián đoạn chỉ giữ mốc tiến độ cuối đã ghi; không tự tiếp tục bài hoặc bật camera. Chuỗi bài không tự khôi phục.')}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {!rows.length && !loading && !error ? <Text style={styles.body}>{t('Không có bản nháp chưa lưu.')}</Text> : null}
    {rows.map((row) => <View key={row.id} style={styles.panel}><Text style={styles.title}>{testName(row.test_id)}</Text><Text style={styles.body}>{row.patient_name || t('Không gắn hồ sơ')}</Text><Text style={styles.status}>{pendingStatus(row.status)}</Text><Text style={styles.body}>{new Date(row.updated_at).toLocaleString(getLocale())} · {Math.floor(row.elapsed_ms / 1000)} / 30 s</Text><Button secondary disabled={loading} onPress={() => { void open(row.id); }}>{t('Khôi phục bản nháp')}</Button></View>)}
    {hasMore ? <Button secondary disabled={loading} onPress={() => { void load(rows.length); }}>{t('Tải thêm')}</Button> : null}
    <Button secondary disabled={loading} onPress={() => { void load(); }}>{t('Tải lại danh sách')}</Button>
  </Screen>;
}

/** @param {{row: import('../../services/pendingRunRepository').PendingRun, ownerId: string, onBack: () => void}} props */
function RecoveredEditor({ row, ownerId, onBack }) {
  useLanguage();
  const auth = useAuth();
  const account = useRef(auth);
  useLayoutEffect(() => { account.current = auth; }, [auth]);
  const mounted = useRef(true);
  const [notes, setNotes] = useState(row.notes);
  const [state, setState] = useState('saved');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const writer = useRef(/** @type {ReturnType<typeof createPendingWriter<import('../../services/pendingRunRepository').RunCheckpoint>> | null} */ (null));
  const isCurrent = () => mounted.current && account.current.isSignedIn && account.current.session?.user.id === ownerId && !account.current.endingSession;
  useEffect(() => {
    mounted.current = true;
    const created = createPendingWriter({ revision: row.revision,
      write: (/** @type {import('../../services/pendingRunRepository').RunCheckpoint} */ snapshot, revision) => pendingRuns.update(ownerId, row.id, snapshot, revision),
      onState: (value) => { if (mounted.current) setState(value); },
    });
    writer.current = created;
    return () => { mounted.current = false; void created.flush().catch(() => {}).finally(() => created.close()); };
  }, [ownerId, row]);
  function changeNotes(/** @type {string} */ value) {
    setNotes(value); writer.current?.set({ ...pendingCheckpoint(row), notes: value });
  }
  async function save() {
    if (lock.current || !isCurrent()) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await writer.current?.flush();
      if (!isCurrent()) return;
      await pendingRuns.recover(ownerId, row.id, notes, isCurrent);
      writer.current?.close();
      if (isCurrent()) router.replace({ pathname: '/sessions/[id]', params: { id: row.id } });
    } catch (failure) { if (isCurrent()) setError(failure instanceof Error ? failure.message : t('Không lưu được bản nháp. Hãy thử lại.')); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  function remove(restart = false) {
    Alert.alert(t('Xóa bản nháp này?'), t('Sẽ xóa mốc tiến độ và ghi chú của bản nháp. Những phiên đã lưu trong lịch sử vẫn được giữ.'), [
      { text: t('Ở lại'), style: 'cancel' }, { text: t('Xóa bản nháp'), style: 'destructive', onPress: () => {
        if (lock.current || !isCurrent()) return;
        lock.current = true; setBusy(true); setError('');
        void pendingRuns.remove(ownerId, row.id).then(() => {
          writer.current?.close();
          if (!isCurrent()) return;
          if (restart) router.replace({ pathname: '/tests/[id]', params: { id: row.test_id } });
          else onBack();
        }).catch(() => { if (isCurrent()) setError(t('Chưa xóa được bản nháp. Hãy thử lại.')); }).finally(() => { lock.current = false; if (mounted.current) setBusy(false); });
      } },
    ]);
  }
  return <Screen title={t('Khôi phục bản nháp')} subtitle={testName(row.test_id)}>
    <View style={styles.panel}><Text style={styles.status}>{pendingStatus(row.status)}</Text><Text style={styles.title}>{row.patient_name || t('Không gắn hồ sơ')}</Text><Text style={styles.body}>{t('Mốc tiến độ đã lưu: {0} / 30 giây', [Math.floor(row.elapsed_ms / 1000)])}</Text><Text style={styles.body}>{new Date(row.updated_at).toLocaleString(getLocale())}</Text><Text style={styles.body}>{t('Không khôi phục video hoặc tự bật camera. Chỉ sử dụng dữ liệu mẫu.')}</Text></View>
    {row.status === 'active' ? <Text style={styles.body}>{t('Lượt này bị gián đoạn trước khi xác nhận kết quả. Không thể lưu thành bài hoàn tất; hãy xóa bản nháp và chuẩn bị bài mới.')}</Text> : null}
    {row.camera_status === 'pending' || row.camera_status === 'error' ? <Text style={styles.body}>{t('Chưa xác nhận camera đã xử lý xong ở thời điểm lưu nháp. Không suy ra ghi hình hoặc xóa video thành công.')}</Text> : null}
    <Field label={t('Ghi chú cho lượt này (không bắt buộc)')} value={notes} onChangeText={changeNotes} editable={!busy} multiline textAlignVertical="top" style={{ minHeight: 110 }} maxLength={1000} onActivity={auth.recordActivity} />
    <Text accessibilityLiveRegion="polite" style={state === 'error' ? styles.error : styles.body}>{state === 'error' ? t('Chưa lưu được bản nháp mới nhất. Đừng đóng ứng dụng; hãy thử lại hoặc lưu vào lịch sử.') : state === 'saving' ? t('Đang lưu bản nháp…') : t('Đã lưu bản nháp trên thiết bị')}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {state === 'error' ? <Button secondary disabled={busy} onPress={() => { void writer.current?.flush().catch(() => {}); }}>{t('Thử lưu bản nháp lại')}</Button> : null}
    {row.status !== 'active' ? <Button loading={busy} onPress={() => { void save(); }}>{t('Lưu vào lịch sử')}</Button> : <Button disabled={busy} onPress={() => remove(true)}>{t('Xóa nháp và chuẩn bị bài mới')}</Button>}
    <SettingsRow title={t('Xóa bản nháp')} danger disabled={busy} onPress={() => remove()} />
    <Button secondary disabled={busy} onPress={onBack}>{t('Về danh sách bản nháp')}</Button>
  </Screen>;
}
const styles = StyleSheet.create({
  panel: { padding: 17, borderRadius: 16, gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#DCE4EB' },
  title: { color: colors.text, fontWeight: '700', fontSize: 18, lineHeight: 26 }, body: { color: colors.muted, fontSize: 14, lineHeight: 22 }, status: { color: colors.primary, fontSize: 14, lineHeight: 22, fontWeight: '600' }, error: { color: colors.danger, fontSize: 14, lineHeight: 22 },
});
