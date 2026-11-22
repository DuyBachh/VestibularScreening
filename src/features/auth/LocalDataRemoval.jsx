import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from './AuthProvider';
import { accountData } from '../../services/accountData';
import { Notice } from '../../components/Notice';
import { SettingsRow } from '../settings/SettingsUI';

/** @param {{ownerId: string}} props */
export function LocalDataRemoval({ ownerId }) {
  useLanguage();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const generation = useRef(0);
  const lock = useRef(false);
  useFocusEffect(useCallback(() => {
    active.current = auth.isSignedIn && auth.session?.user.id === ownerId;
    return () => { active.current = false; generation.current++; };
  }, [auth.isSignedIn, auth.session?.user.id, ownerId]));

  async function confirm() {
    if (lock.current || !active.current || auth.endingSession) return;
    const token = generation.current;
    const isCurrent = () => active.current && generation.current === token;
    lock.current = true;
    setBusy(true); setError(''); auth.recordActivity();
    try {
      const data = await accountData.summary(ownerId);
      if (!isCurrent()) return;
      Alert.alert(t("Xóa dữ liệu và đăng xuất?"),
        t("Tài khoản: {0}\n\nSẽ xóa vĩnh viễn trên thiết bị này:\n• {1} hồ sơ đang dùng\n• {2} hồ sơ trong thùng rác\n• {3} lượt chạy và ghi chú\n• {4}\n\nKhông thể khôi phục. Tài khoản Supabase, thông tin cá nhân và PDF đã lưu trong Tệp vẫn được giữ. Dữ liệu tài khoản khác không bị xóa.", [auth.session?.user.email || '', data.patients, data.trashed, data.sessions, data.logos ? t("Logo cơ sở đã lưu") : t("Không có logo cơ sở")]) + '\n\n' + t('Nhật ký hoạt động của tài khoản cũng sẽ bị xóa.') + '\n' + t('Sẽ xóa thêm {0} bản nháp chưa lưu.', [data.drafts]), [
          { text: t("Giữ lại"), style: 'cancel' },
          { text: t("Xóa và đăng xuất"), style: 'destructive', onPress: () => { void remove(); } },
        ]);
      async function remove() {
        if (!isCurrent() || lock.current) return;
        lock.current = true; setBusy(true); auth.recordActivity();
        try {
          const done = await auth.signOut(t("Đã xóa dữ liệu của tài khoản trên thiết bị này và đăng xuất."), { clearLocalOwner: ownerId });
          if (!done && isCurrent()) setError(t("Không thể hoàn tất yêu cầu hoặc tài khoản đã thay đổi. Hãy kiểm tra lại dữ liệu rồi thử lại."));
        } finally {
          lock.current = false;
          if (isCurrent()) setBusy(false);
        }
      }
    } catch {
      if (isCurrent()) setError(t("Không đọc được dữ liệu. Chưa xóa gì; hãy thử lại."));
    } finally {
      lock.current = false;
      if (isCurrent()) setBusy(false);
    }
  }
  if (Platform.OS === 'web') return null;
  return <View>
    <SettingsRow title={t("Xóa dữ liệu và đăng xuất")} subtitle={t("Xóa vĩnh viễn hồ sơ, lịch sử và logo trên máy")} danger loading={busy} disabled={auth.endingSession} onPress={() => { void confirm(); }} />
    <Notice error>{error}</Notice>
  </View>;
}
