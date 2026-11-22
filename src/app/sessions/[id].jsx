import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { RouteButton } from '../../components/RouteButton';
import { useAuth } from '../../features/auth/AuthProvider';
import { sessionDatabase } from '../../services/sessionDatabase';
import { testName, sessionDate } from '../../features/tests/SessionHistoryScreen';
import { colors } from '../../constants/theme';
import { SessionReportActions } from '../../features/tests/SessionReportActions';

export default function SessionDetail() {
  useLanguage();
  const { id } = useLocalSearchParams();
  const auth = useAuth();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  const [data, setData] = useState(/** @type {{owner: string, item: import('../../services/sessionRepository').SessionRecord} | null} */ (null));
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const requestSequence = useRef(0);
  const loadSession = useCallback(async () => {
    if (!owner || typeof id !== 'string') return;
    const token = ++requestSequence.current;
    setLoading(true); setError(''); setMessage('');
    try {
      const record = await sessionDatabase.get(owner, id);
      if (token === requestSequence.current) {
        setData(record ? { owner, item: record } : null);
        setNotes(record?.notes || '');
        if (!record) setError(t("Phiên không tồn tại hoặc hồ sơ đã chuyển vào thùng rác. Hãy kiểm tra thùng rác nếu muốn khôi phục."));
      }
    } catch { if (token === requestSequence.current) setError(t("Không đọc được phiên. Hãy thử lại.")); }
    finally { if (token === requestSequence.current) setLoading(false); }
  }, [owner, id]);
  useFocusEffect(useCallback(() => {
    void loadSession();
    return () => { requestSequence.current++; };
  }, [loadSession]));
  const item = data && data.owner === owner && data.item.id === id ? data.item : null;
  async function saveNotes() {
    if (!owner || typeof id !== 'string' || saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await sessionDatabase.updateNotes(owner, id, notes);
      setData((current) => current && current.owner === owner && current.item.id === id ? { ...current, item: { ...current.item, notes: notes.trim() } } : current);
      setMessage(t("Đã lưu ghi chú."));
    }
    catch { setError(t("Không lưu được ghi chú. Kiểm tra phiên còn tồn tại rồi thử lại.")); }
    finally { setSaving(false); }
  }
  return <Screen title={t("Chi tiết lượt kiểm tra")} subtitle={t("Thông tin mô phỏng học tập, không phải kết quả chẩn đoán.")}>
    {loading ? <Text style={styles.body}>{t("Đang tải…")}</Text> : item ? <>
      <Card title={testName(item.test_id)}>{item.patient_name || t("Không gắn hồ sơ")}{item.patient_code ? ` · ${item.patient_code}` : ''}{'\n'}{item.status === 'completed' ? t("Hoàn tất bài mô phỏng") : t("Đã hủy")} · {Math.round(item.elapsed_ms / 1000)} {t(" giây thực hiện")}{'\n'}{t("Bắt đầu: ")}{sessionDate(item.started_at)}{'\n'}{t("Kết thúc: ")}{sessionDate(item.ended_at)}</Card>
      <Card title="Camera">{item.camera_status === 'not_used' ? t("Không ghi video trong lượt này.") : item.camera_status === 'error' ? t("Có lỗi ghi/xóa camera. Không coi là ghi hình thành công.") : t("Đã ghi và xóa {0} đoạn video tạm.", [item.deleted_segments])}{'\n'}{t("Lịch sử không chứa video, dữ liệu đồng tử hoặc chỉ số mắt.")}</Card>
      <Field label={t("Ghi chú phiên")} value={notes} onChangeText={(value) => { setNotes(value); setMessage(''); }} maxLength={1000} multiline style={{ minHeight: 120 }} onActivity={auth.recordActivity} />
      <Button onPress={saveNotes} loading={saving}>{t("Lưu ghi chú")}</Button>
      {message ? <Text style={styles.body}>{message}</Text> : null}
      {owner ? <SessionReportActions key={`${owner}:${item.id}`} ownerId={owner} sessionId={item.id} notesDirty={notes.trim() !== item.notes.trim()} saving={saving} /> : null}
      {item.patient_id ? <RouteButton href={{ pathname: '/patient-history/[id]', params: { id: item.patient_id } }}>{t("Các lượt của bệnh nhân này")}</RouteButton> : null}
    </> : null}
    {error ? <><Text style={styles.error}>{error}</Text><Button secondary onPress={() => { void loadSession(); }}>{t("Tải lại phiên")}</Button></> : null}
  </Screen>;
}
const styles = StyleSheet.create({ body: { color: colors.muted, fontSize: 16, lineHeight: 25 }, error: { color: colors.danger, fontSize: 16, lineHeight: 25 } });
