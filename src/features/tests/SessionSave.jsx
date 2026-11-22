import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { useAuth } from '../auth/AuthProvider';
import { sessionDatabase } from '../../services/sessionDatabase';
import { colors } from '../../constants/theme';

/** @param {{ draft: import('./sessionData').SessionDraft, ownerId: string, patientName: string, onSaved: () => void, onSaving: (saving: boolean) => void, embedded?: boolean }} props */
export function SessionSave({ draft, ownerId, patientName, onSaved, onSaving, embedded = false }) {
  useLanguage();
  const auth = useAuth();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function save() {
    if (lock.current || saved) return;
    if (!auth.isSignedIn || auth.session?.user.id !== ownerId) { setError(t("Tài khoản đã thay đổi. Không thể lưu lượt chạy này.")); return; }
    lock.current = true;
    onSaving(true);
    setSaving(true);
    setError('');
    try { await sessionDatabase.save(ownerId, draft, notes); setSaved(true); onSaved(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : t("Không lưu được phiên. Hãy thử lại.")); }
    finally { setSaving(false); lock.current = false; onSaving(false); }
  }
  return <View style={[styles.panel, embedded && styles.embedded]}>
    {!embedded || saved ? <Text style={styles.title}>{saved ? t("Đã lưu vào lịch sử") : t("Lưu lượt kiểm tra")}</Text> : null}
    {!embedded ? <Text style={styles.body}>{patientName || t("Không gắn hồ sơ")} · {Math.round(draft.elapsedMs / 1000)} {t(" giây · ")}{draft.status === 'completed' ? t("Hoàn tất bài mô phỏng") : t("Đã hủy")}</Text> : null}
    {draft.cameraStatus === 'error' ? <Text style={styles.error}>{t("Lượt chạy có lỗi camera; lịch sử sẽ ghi rõ lỗi này.")}</Text> : null}
    {saved ? <Text style={styles.body}>{t("Mở tab Lịch sử để xem chi tiết. Chỉ lưu thông tin lượt chạy và ghi chú, không có video hoặc chỉ số mắt.")}</Text> : <>
      <Field label={t("Ghi chú cho lượt này (không bắt buộc)")} value={notes} onChangeText={setNotes} editable={!saving} maxLength={1000} multiline textAlignVertical="top" style={{ minHeight: 90 }} placeholder={t("Ghi chú học tập, tối đa 1.000 ký tự")} onActivity={auth.recordActivity} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button loading={saving} onPress={save}>{t("Lưu vào lịch sử")}</Button>
      <Text style={styles.hint}>{t("Chỉ lưu khi bạn bấm Lưu vào lịch sử. Không lưu video hoặc chỉ số mắt.")}</Text>
    </>}
  </View>;
}
const styles = StyleSheet.create({ panel: { padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 16, gap: 12 },
  embedded: { padding: 0, borderWidth: 0, backgroundColor: 'transparent' }, hint: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23 }, error: { color: colors.danger, fontSize: 15, lineHeight: 23 },
});
