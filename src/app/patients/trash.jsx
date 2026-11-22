import { t, getLocale, genderLabel } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, AppState, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../features/auth/AuthProvider';
import { patientTrash } from '../../services/patientDatabase';
import { RETENTION_MS } from '../../services/patientTrashRepository';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';

export default function PatientTrashScreen() {
  useLanguage();
  const auth = useAuth();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  const [data, setData] = useState(/** @type {{owner: string, items: import('../../services/patientTrashRepository').TrashPatient[]}} */ ({ owner: '', items: [] }));
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const sequence = useRef(0);
  const lock = useRef(false);
  const items = data.owner === owner ? data.items : [];
  const load = useCallback(async (offset = 0) => {
    if (!owner) return;
    const token = ++sequence.current;
    setLoading(true); setError('');
    try {
      const rows = await patientTrash.list(owner, offset);
      if (token === sequence.current) { setData((old) => ({ owner, items: offset && old.owner === owner ? [...old.items, ...rows] : rows })); setMore(rows.length === 30); }
    } catch { if (token === sequence.current) setError(t("Không mở được thùng rác. Hãy thử lại.")); }
    finally { if (token === sequence.current) setLoading(false); }
  }, [owner]);
  useFocusEffect(useCallback(() => {
    void load();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active' && !lock.current) void load(); });
    return () => { sequence.current++; subscription.remove(); };
  }, [load]));

  /** @param {string} id @param {boolean} permanently */
  async function act(id, permanently) {
    if (!owner || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const changed = permanently ? await patientTrash.removePermanently(owner, id) : await patientTrash.restore(owner, id);
      if (!changed) throw new Error(t("Hồ sơ không còn trong thùng rác hoặc đã hết hạn khôi phục. Hãy tải lại danh sách."));
      setMessage(permanently ? t("Đã xóa vĩnh viễn hồ sơ và các phiên liên quan.") : t("Đã khôi phục hồ sơ cùng lịch sử kiểm tra."));
      await load();
    } catch (failure) { setError(failure instanceof Error && failure.message.startsWith(t("Hồ sơ")) ? failure.message : t("Không hoàn tất thao tác. Hãy thử lại.")); }
    finally { lock.current = false; setBusy(false); }
  }

  return <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
    <View style={styles.header}><Text style={styles.title}>{t("Thùng rác bệnh nhân")}</Text>
      <Text style={styles.body}>{t("Khôi phục hồ sơ cùng lịch sử trong 30 ngày kể từ lúc chuyển vào thùng rác. Hồ sơ hết hạn được dọn khi mở/quay lại ứng dụng hoặc khi mở quản lý hồ sơ.")}</Text>
      {message ? <Text accessibilityLiveRegion="polite" style={styles.success}>{message}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
    <FlatList style={{ flex: 1 }} data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
      refreshing={loading} onRefresh={() => { if (!busy) void load(); }}
      ListEmptyComponent={<Text style={styles.body}>{loading ? t("Đang tải…") : error ? '' : t("Thùng rác đang trống.")}</Text>}
      renderItem={({ item }) => <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text><Text style={styles.body}>{item.code} · {genderLabel(item.gender)}</Text>
        <Text style={styles.body}>{item.session_count} {t(" phiên được giữ cùng hồ sơ")}</Text>
        <Text style={styles.body}>{t("Đã xóa: ")}{new Date(item.deleted_at).toLocaleString(getLocale())}{'\n'}{t("Hạn khôi phục: ")}{new Date(item.deleted_at + RETENTION_MS).toLocaleString(getLocale())}</Text>
        <Button disabled={busy || loading} onPress={() => { void act(item.id, false); }}>{t("Khôi phục hồ sơ")}</Button>
        <Button secondary disabled={busy || loading} onPress={() => Alert.alert(t("Xóa vĩnh viễn hồ sơ?"), t("{0} ({1}) và {2} phiên liên quan sẽ bị xóa khỏi thiết bị, không thể khôi phục.", [item.name, item.code, item.session_count]), [
          { text: t("Giữ lại"), style: 'cancel' }, { text: t("Xóa vĩnh viễn"), style: 'destructive', onPress: () => { void act(item.id, true); } },
        ])}>{t("Xóa vĩnh viễn")}</Button>
      </View>}
      ListFooterComponent={<View style={styles.footer}>{more ? <Button secondary loading={loading} disabled={busy} onPress={() => { void load(items.length); }}>{t("Xem thêm")}</Button> : null}<Button secondary disabled={busy || loading} onPress={() => { void load(); }}>{t("Tải lại thùng rác")}</Button></View>} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { padding: 20, gap: 10 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 12 },
  name: { color: colors.text, fontSize: 19, fontWeight: '700' }, footer: { gap: 12, paddingVertical: 10 }, error: { color: colors.danger, fontSize: 15, lineHeight: 23 }, success: { color: colors.success, fontSize: 15, lineHeight: 23 },
});
