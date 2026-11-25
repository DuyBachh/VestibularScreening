import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { useAuth } from '../auth/AuthProvider';
import { exportSessionReport } from '../../services/sessionReportExport';
import { colors } from '../../constants/theme';
import { isPrintCancellation } from './sessionReport';
import { exportBatteryReport } from '../../services/batteryReportExport';

/** @param {{ ownerId: string, sessionId?: string, batteryId?: string, notesDirty: boolean, saving: boolean }} props */
export function SessionReportActions({ ownerId, sessionId = '', batteryId = '', notesDirty, saving }) {
  useLanguage();
  const auth = useAuth();
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const active = useRef(false);
  const lock = useRef(false);
  const generation = useRef(0);
  useFocusEffect(useCallback(() => {
    active.current = auth.isSignedIn && auth.session?.user.id === ownerId && !auth.endingSession;
    if (!lock.current) setWorking(false);
    return () => { active.current = false; generation.current++; };
  }, [auth.isSignedIn, auth.session?.user.id, auth.endingSession, ownerId]));
  /** @param {'print' | 'share'} mode */
  async function run(mode) {
    if (lock.current || saving || notesDirty) return;
    if (!auth.isSignedIn || auth.session?.user.id !== ownerId) return;
    lock.current = true;
    const token = generation.current;
    const isCurrent = () => active.current && generation.current === token;
    setWorking(true); setMessage(''); setError('');
    auth.recordActivity();
    try {
      const metadata = auth.session?.user.user_metadata;
      const reporter = { fullName: metadata?.full_name, specialty: metadata?.specialty, workplace: metadata?.workplace };
      if (batteryId) await exportBatteryReport({ ownerId, batteryId, mode, isCurrent, reporter });
      else await exportSessionReport({ ownerId, sessionId, mode, isCurrent, reporter });
      if (isCurrent()) setMessage(mode === 'share' ? t("Đã đóng bảng chia sẻ. Nếu đã chọn Lưu vào Tệp, bạn có thể mở file từ ứng dụng Tệp.") : t("Đã đóng cửa sổ xem / in báo cáo."));
    } catch (failure) {
      if (isCurrent()) {
        if (mode === 'print' && isPrintCancellation(failure)) setMessage(t("Đã đóng cửa sổ xem / in. Chưa gửi lệnh in."));
        else setError(failure instanceof Error ? failure.message : t("Không xuất được báo cáo. Hãy thử lại."));
      }
    } finally {
      lock.current = false;
      if (active.current) { setWorking(false); auth.recordActivity(); }
    }
  }
  if (Platform.OS === 'web') return <Text style={styles.body}>{t("Xuất PDF và chia sẻ được hỗ trợ trên điện thoại.")}</Text>;
  return <View style={styles.panel}>
    <Text style={styles.title}>{t("Báo cáo PDF")}</Text>
    <Text style={styles.body}>{batteryId ? t('Một PDF chung cho sáu bài, phân biệt lượt đã lưu, bản nháp và lượt chưa thực hiện.') : t("Thông tin phiên và ghi chú đã lưu, có nhãn mô phỏng học tập.")}</Text>
    {notesDirty ? <Text style={styles.body}>{t("Hãy lưu ghi chú trước khi xuất báo cáo.")}</Text> : null}
    <Button secondary loading={working} disabled={saving || notesDirty} onPress={() => { void run('print'); }}>{t("Xem / in báo cáo")}</Button>
    <Button disabled={working || saving || notesDirty} onPress={() => { void run('share'); }}>{t("Xuất / chia sẻ PDF")}</Button>
    {message ? <Text style={styles.body}>{message}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({ panel: { padding: 18, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23 }, error: { color: colors.danger, fontSize: 15, lineHeight: 23 },
});
