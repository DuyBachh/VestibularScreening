import { t, getLocale } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { sessionDatabase } from '../../services/sessionDatabase';
import { testCatalog } from './catalog';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';

/** @param {string} id */
export function testName(id) { return testCatalog.find((test) => test.id === id)?.name || id; }
/** @param {string} value */
export function sessionDate(value) { return new Date(value).toLocaleString(getLocale()); }

/** @param {{ patientId?: string }} props */
export function SessionHistoryScreen({ patientId = '' }) {
  useLanguage();
  const auth = useAuth();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  const [data, setData] = useState(/** @type {{owner: string, patientId: string, items: import('../../services/sessionRepository').SessionRecord[]}} */ ({ owner: '', patientId: '', items: [] }));
  const [compareMode, setCompareMode] = useState(false);
  const [selection, setSelection] = useState(/** @type {{owner: string, scope: string, items: import('../../services/sessionRepository').SessionRecord[]}} */ ({ owner: '', scope: '', items: [] }));
  const selected = selection.owner === owner && selection.scope === patientId ? selection.items : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const sequence = useRef(0);
  const lock = useRef(false);
  const items = data.owner === owner && data.patientId === patientId ? data.items : [];
  const load = useCallback(async (offset = 0) => {
    if (!owner) return;
    if (offset === 0) setSelection({ owner, scope: patientId, items: [] });
    const token = ++sequence.current;
    lock.current = true; setLoading(true); setError('');
    try {
      const rows = await sessionDatabase.list(owner, patientId || null, 30, offset);
      if (token !== sequence.current) return;
      setData((old) => ({ owner, patientId, items: offset && old.owner === owner && old.patientId === patientId ? [...old.items, ...rows] : rows }));
      setHasMore(rows.length === 30);
    } catch { if (token === sequence.current) setError(t("Không tải được lịch sử. Hãy thử lại.")); }
    finally { if (token === sequence.current) { setLoading(false); lock.current = false; } }
  }, [owner, patientId]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { sequence.current++; lock.current = false; };
  }, [load]));

  /** @param {import('../../services/sessionRepository').SessionRecord} item */
  function toggleSelection(item) {
    if (!owner || !item.patient_id) return;
    const found = selected.some((session) => session.id === item.id);
    const previous = selected[0];
    if (!found && (selected.length >= 2 || (previous && (previous.patient_id !== item.patient_id || previous.test_id !== item.test_id)))) return;
    setSelection({ owner, scope: patientId, items: found ? selected.filter((session) => session.id !== item.id) : [...selected, item] });
  }

  if (!owner) return <Screen title={t("Lịch sử kiểm tra")} subtitle={t("Đăng nhập để xem các lượt đã lưu của tài khoản.")}><Text style={styles.body}>{t("Chế độ xem trước không đọc dữ liệu lịch sử.")}</Text></Screen>;
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
    <View style={styles.header}><Text style={styles.title}>{patientId ? t("Lịch sử bệnh nhân") : t("Lịch sử kiểm tra")}</Text><Text style={styles.body}>{t("Mới nhất trước · Chỉ lưu trên thiết bị")}</Text>
      <Button secondary disabled={loading} onPress={() => router.push({ pathname: '/battery-history', params: patientId ? { patientId } : {} })}>{t('Lịch sử chuỗi 6 bài')}</Button>
      <Button secondary disabled={loading} onPress={() => { setCompareMode(!compareMode); setSelection({ owner, scope: patientId, items: [] }); }}>{compareMode ? t("Hủy chọn so sánh") : t("So sánh hai lượt")}</Button>
      {compareMode ? <Text style={styles.body}>{t("Chọn 2 lượt của cùng bệnh nhân và cùng bài. Không chọn lượt không gắn hồ sơ.")}</Text> : null}
    </View>
    <FlatList style={styles.listView} data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} refreshing={loading} onRefresh={() => { void load(); }}
      ListEmptyComponent={!loading ? <Text style={styles.body}>{error || t("Chưa có phiên đã lưu. Chọn bệnh nhân, chạy bài và bấm Lưu vào lịch sử sau khi kết thúc.")}</Text> : <ActivityIndicator color={colors.primary} />}
      extraData={{ compareMode, selection }}
      renderItem={({ item }) => {
        const checked = selected.some((session) => session.id === item.id);
        const anchor = selected[0];
        const compatible = !!item.patient_id && (!anchor || (anchor.patient_id === item.patient_id && anchor.test_id === item.test_id));
        const disabled = compareMode && !checked && (!compatible || selected.length >= 2);
        return <Pressable accessibilityRole={compareMode ? 'checkbox' : 'button'} accessibilityState={compareMode ? { checked, disabled } : undefined}
          disabled={disabled} onPress={() => compareMode ? toggleSelection(item) : router.push({ pathname: '/sessions/[id]', params: { id: item.id } })}
          style={[styles.card, checked && styles.checked, disabled && styles.unavailable]}>
          <View style={styles.row}><Text style={styles.name}>{testName(item.test_id)}</Text>{compareMode ? <Text style={styles.action}>{checked ? t("✓ Đã chọn") : disabled ? compatible ? t("Đã đủ 2 lượt") : t("Không phù hợp") : t("○ Chọn")}</Text> : null}</View>
          <Text style={styles.patient}>{item.patient_name || t("Không gắn hồ sơ")}{item.patient_code ? ` · ${item.patient_code}` : ''}</Text>
          <Text style={styles.body}>{sessionDate(item.ended_at)}</Text>
          <View style={styles.row}><Text style={styles.tag}>{item.status === 'completed' ? t("Hoàn tất") : t("Đã hủy")} · {Math.round(item.elapsed_ms / 1000)} {t(" giây")}</Text>{!compareMode ? <Text style={styles.action}>{t("Chi tiết →")}</Text> : null}</View>
          {compareMode && !compatible ? <Text style={styles.body}>{!item.patient_id ? t("Lượt không gắn hồ sơ không dùng để so sánh.") : t("Khác bệnh nhân hoặc bài với lượt đã chọn.")}</Text> : null}
          {item.camera_status === 'error' ? <Text style={styles.error}>{t("Có lỗi camera")}</Text> : null}
          {item.notes ? <Text numberOfLines={2} style={styles.body}>{item.notes}</Text> : null}
        </Pressable>;
      }}
      ListFooterComponent={<View style={styles.footer}>{error && items.length ? <Text style={styles.error}>{error}</Text> : null}
        {error ? <Button secondary onPress={() => { void load(); }}>{t("Tải lại")}</Button> : hasMore ? <Button secondary loading={loading} onPress={() => { if (!lock.current) void load(items.length); }}>{t("Xem thêm")}</Button> : null}
        <Text style={styles.body}>{t("Dữ liệu mô phỏng học tập. Không có chỉ số hoặc kết luận y tế.")}</Text>
      </View>} />
    {compareMode ? <View style={styles.compareBar}><Text style={styles.body}>{t("Đã chọn ")}{selected.length}{t("/2 lượt")}</Text>
      <Button disabled={selected.length !== 2 || loading} onPress={() => { if (selected.length === 2) router.push({ pathname: '/compare', params: { first: selected[0].id, second: selected[1].id } }); }}>{t("So sánh hai lượt đã chọn")}</Button>
    </View> : null}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  listView: { flex: 1 },
  checked: { borderColor: colors.primary, backgroundColor: colors.tint, borderWidth: 2 }, unavailable: { backgroundColor: '#EDF1F5' }, compareBar: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  safe: { flex: 1, backgroundColor: colors.background }, header: { padding: 20, gap: 6 }, title: { fontSize: 27, fontWeight: '700', color: colors.text }, list: { paddingHorizontal: 20, paddingBottom: 22, gap: 12 },
  card: { backgroundColor: colors.surface, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border, gap: 9 }, name: { color: colors.text, fontSize: 20, fontWeight: '700' }, patient: { color: colors.text, fontSize: 16, fontWeight: '600' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 }, row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }, tag: { color: colors.primary, fontSize: 14, fontWeight: '600' }, action: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 15, lineHeight: 23 }, footer: { paddingVertical: 14, gap: 12 },
});
