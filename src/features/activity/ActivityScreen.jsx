import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../language/LanguageProvider';
import { t, getLocale } from '../language/language';
import { activityDatabase } from '../../services/activityDatabase';
import { colors } from '../../constants/theme';
import { Button } from '../../components/Button';
import { activityLabel } from './activityLabels';

const filters = [
  { id: 'all', label: 'Tất cả' }, { id: 'patient', label: 'Hồ sơ' }, { id: 'session', label: 'Lượt kiểm tra' }, { id: 'report', label: 'Báo cáo' },
];

export function ActivityScreen() {
  useLanguage();
  const auth = useAuth();
  const owner = auth.isSignedIn ? auth.session?.user.id || '' : '';
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState(/** @type {{owner: string, filter: string, items: import('../../services/activityRepository').ActivityEvent[]}} */ ({ owner: '', filter: '', items: [] }));
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const lock = useRef(false);
  const items = data.owner === owner && data.filter === filter ? data.items : [];
  const load = useCallback(async (beforeId = 0) => {
    if (!owner || (beforeId && lock.current)) return;
    const token = ++sequence.current;
    lock.current = true; setLoading(true); setMore(!!beforeId); setError('');
    try {
      const rows = await activityDatabase.list(owner, { category: filter, beforeId: beforeId || undefined, limit: 30 });
      if (token !== sequence.current) return;
      setData((old) => ({ owner, filter, items: beforeId && old.owner === owner && old.filter === filter ? [...old.items, ...rows] : rows }));
      setHasMore(rows.length === 30);
    } catch { if (token === sequence.current) setError(t('Không tải được nhật ký. Hãy thử lại.')); }
    finally { if (token === sequence.current) { lock.current = false; setLoading(false); } }
  }, [owner, filter]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { sequence.current++; lock.current = false; };
  }, [load]));

  return <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>{t('Nhật ký hoạt động')}</Text>
      <Text style={styles.body}>{t('Mới nhất trước · Chỉ ghi thao tác từ bản cập nhật này.')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: filter === item.id }}
          onPress={() => setFilter(item.id)} style={[styles.chip, filter === item.id && styles.selected]}>
          <Text style={[styles.chipText, filter === item.id && styles.selectedText]}>{t(item.label)}</Text>
        </Pressable>)}
      </ScrollView>
    </View>
    {!owner ? <Text style={styles.empty}>{t('Cần đăng nhập để xem nhật ký.')}</Text> : <FlatList data={items} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list}
      refreshing={loading && !more} onRefresh={() => { void load(); }}
      ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.body}>{error || t('Chưa có hoạt động trong nhóm này.')}</Text>}
      renderItem={({ item, index }) => {
        const date = new Date(item.occurred_at);
        const previous = items[index - 1];
        const day = !previous || new Date(previous.occurred_at).toDateString() !== date.toDateString();
        return <View style={styles.event}>
          {day ? <Text accessibilityRole="header" style={styles.day}>{date.toLocaleDateString(getLocale(), { day: '2-digit', month: 'long', year: 'numeric' })}</Text> : null}
          <View style={styles.card}><View style={styles.eventTop}><Text style={styles.action}>{activityLabel(item.event)}</Text><Text style={styles.time}>{date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}</Text></View>
            <Text selectable style={styles.id}>{item.category === 'patient' ? t('ID hồ sơ: {0}', [item.target_id]) : t('ID lượt kiểm tra: {0}', [item.target_id])}</Text>
          </View>
        </View>;
      }}
      ListFooterComponent={<View style={styles.footer}>
        {!!items.length && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {loading && more ? <ActivityIndicator color={colors.primary} /> : null}
        {hasMore && !loading ? <Button secondary onPress={() => { void load(items[items.length - 1]?.id || 0); }}>{t('Xem thêm')}</Button> : null}
        {!loading ? <Button secondary onPress={() => { void load(); }}>{t('Tải lại')}</Button> : null}
        <Text style={styles.note}>{t('Không lưu tên, nội dung ghi chú hoặc tệp báo cáo trong nhật ký. Yêu cầu chia sẻ không xác nhận đã gửi hoặc lưu PDF.')}</Text>
        <Text style={styles.note}>{t('Nhật ký lưu trên thiết bị theo tài khoản, chưa có khả năng chống chỉnh sửa. Xóa dữ liệu và đăng xuất cũng xóa nhật ký của tài khoản.')}</Text>
      </View>} />}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, header: { padding: 20, gap: 9 }, title: { color: colors.text, fontSize: 28, lineHeight: 36, fontWeight: '700' }, body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  filters: { gap: 8, paddingVertical: 5 }, chip: { minHeight: 44, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' }, selected: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.primary, fontSize: 14, lineHeight: 22, fontWeight: '600' }, selectedText: { color: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10, maxWidth: 650, width: '100%', alignSelf: 'center' }, event: { gap: 9 }, day: { color: colors.muted, fontSize: 13, lineHeight: 21, fontWeight: '600', paddingTop: 8 }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 15, gap: 8 }, eventTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, action: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: '600' }, time: { color: colors.muted, fontSize: 12, lineHeight: 21 }, id: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  footer: { gap: 13, paddingTop: 12 }, note: { color: colors.muted, fontSize: 12, lineHeight: 20 }, error: { color: colors.danger, fontSize: 14, lineHeight: 22 }, empty: { color: colors.muted, padding: 20 },
});
