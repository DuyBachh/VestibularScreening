import { t } from '../features/language/language.js';
import { useLanguage } from '../features/language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { RouteButton } from '../components/RouteButton';
import { useAuth } from '../features/auth/AuthProvider';
import { sessionDatabase } from '../services/sessionDatabase';
import { loadSessionComparison } from '../features/tests/sessionComparison';
import { testName, sessionDate } from '../features/tests/SessionHistoryScreen';
import { colors } from '../constants/theme';

/** @param {{label: string, before: string, after: string}} props */
function ComparisonRow({ label, before, after }) {
  useLanguage();
  return <View style={styles.metric}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.values}><Text style={styles.value}>{before}</Text><Text style={[styles.value, styles.laterValue]}>{after}</Text></View>
  </View>;
}
/** @param {import('../services/sessionRepository').SessionRecord} session */
function cameraText(session) {
  return session.camera_status === 'not_used' ? t("Không quay") : session.camera_status === 'error' ? t("Có lỗi camera") : t("Đã xóa {0} đoạn video", [session.deleted_segments]);
}
export default function CompareScreen() {
  useLanguage();
  const params = useLocalSearchParams();
  const first = typeof params.first === 'string' ? params.first : '';
  const second = typeof params.second === 'string' ? params.second : '';
  const auth = useAuth();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  const [data, setData] = useState(/** @type {{owner: string, first: string, second: string, comparison: Awaited<ReturnType<typeof loadSessionComparison>>} | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    if (!owner) return;
    const token = ++sequence.current;
    setLoading(true); setError(''); setData(null);
    try {
      const comparison = await loadSessionComparison(sessionDatabase.get, owner, first, second);
      if (token === sequence.current) setData({ owner, first, second, comparison });
    } catch (failure) { if (token === sequence.current) setError(failure instanceof Error ? failure.message : t("Không tải được hai lượt kiểm tra.")); }
    finally { if (token === sequence.current) setLoading(false); }
  }, [owner, first, second]);
  useFocusEffect(useCallback(() => { void load(); return () => { sequence.current++; }; }, [load]));
  const comparison = data && data.owner === owner && data.first === first && data.second === second ? data.comparison : null;
  return <Screen title={t("So sánh hai lượt")} subtitle={t("Đối chiếu thông tin lượt chạy, chưa đánh giá thay đổi chức năng mắt.")}>
    {loading ? <Text style={styles.body}>{t("Đang tải hai lượt…")}</Text> : comparison ? <>
      <Card title={comparison.earlier.patient_name || t("Bệnh nhân")}>{comparison.earlier.patient_code || ''}{'\n'}{testName(comparison.earlier.test_id)}</Card>
      <View style={styles.table}>
        <View style={styles.values}><Text style={styles.columnTitle}>{t("Lượt trước")}</Text><Text style={styles.columnTitle}>{t("Lượt sau")}</Text></View>
        <ComparisonRow label={t("Thời điểm kết thúc")} before={sessionDate(comparison.earlier.ended_at)} after={sessionDate(comparison.later.ended_at)} />
        <ComparisonRow label={t("Trạng thái")} before={comparison.earlier.status === 'completed' ? t("Hoàn tất") : t("Đã hủy")} after={comparison.later.status === 'completed' ? t("Hoàn tất") : t("Đã hủy")} />
        <ComparisonRow label={t("Thời gian thực hiện")} before={t("{0} giây", [Math.round(comparison.earlier.elapsed_ms / 1000)])} after={t("{0} giây", [Math.round(comparison.later.elapsed_ms / 1000)])} />
        <ComparisonRow label="Camera" before={cameraText(comparison.earlier)} after={cameraText(comparison.later)} />
      </View>
      <Card title={t("Chênh lệch thời gian thực hiện")}>{comparison.deltaMs === 0 ? t("Hai lượt có cùng thời gian thực hiện.") : t("Lượt sau thực hiện {0} {1} giây so với lượt trước.", [comparison.deltaMs > 0 ? t("dài hơn") : t("ngắn hơn"), Math.abs(comparison.deltaMs) / 1000])}{'\n'}{t("Thời lượng khác nhau có thể do hủy giữa bài. Đây không phải chỉ số cải thiện hoặc suy giảm sức khỏe.")}</Card>
      <Card title={t("Ghi chú lượt trước")}>{comparison.earlier.notes || t("Không có ghi chú.")}</Card>
      <Card title={t("Ghi chú lượt sau")}>{comparison.later.notes || t("Không có ghi chú.")}</Card>
      <RouteButton href={{ pathname: '/sessions/[id]', params: { id: comparison.earlier.id } }}>{t("Mở chi tiết lượt trước")}</RouteButton>
      <RouteButton href={{ pathname: '/sessions/[id]', params: { id: comparison.later.id } }}>{t("Mở chi tiết lượt sau")}</RouteButton>
    </> : null}
    {error ? <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Button secondary onPress={() => { void load(); }}>{t("Thử tải lại")}</Button></> : null}
    <RouteButton href="/history">{t("Về lịch sử kiểm tra")}</RouteButton>
  </Screen>;
}
const styles = StyleSheet.create({ table: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, gap: 14 },
  values: { flexDirection: 'row', gap: 14 }, columnTitle: { flex: 1, color: colors.primary, fontSize: 18, fontWeight: '700' },
  metric: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#DCE4EB', gap: 8 }, label: { fontSize: 14, lineHeight: 21, color: colors.muted, fontWeight: '600' },
  value: { flex: 1, fontSize: 16, lineHeight: 24, color: colors.text }, laterValue: { fontWeight: '600' }, body: { color: colors.muted, fontSize: 16, lineHeight: 25 }, error: { color: colors.danger, fontSize: 16, lineHeight: 25 },
});
