import { t } from '../features/language/language.js';
import { useLanguage } from '../features/language/LanguageProvider';
import { useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';
import { AccountField, AccountLink, AccountScreen, accountStyles } from '../features/auth/AccountUI';
import { colors } from '../constants/theme';
import { Button } from '../components/Button';
import { Notice } from '../components/Notice';
import { useAuth } from '../features/auth/AuthProvider';
import { useAuthForm } from '../features/auth/useAuthForm';
import { requireSupabase } from '../services/supabase';
import { ProfileLogo } from '../features/auth/ProfileLogo';

export default function ProfileScreen() {
  useLanguage();
  const auth = useAuth();
  const form = useAuthForm();
  const user = auth.session?.user;
  const [name, setName] = useState(String(user?.user_metadata.full_name || ''));
  const [specialty, setSpecialty] = useState(String(user?.user_metadata.specialty || ''));
  const [workplace, setWorkplace] = useState(String(user?.user_metadata.workplace || ''));

  /** @type {import('react').RefObject<import('react').ComponentRef<typeof import('react-native').TextInput> | null>} */
  const specialtyInput = useRef(null);
  /** @type {import('react').RefObject<import('react').ComponentRef<typeof import('react-native').TextInput> | null>} */
  const workplaceInput = useRef(null);
  const initials = (name.trim() || user?.email || 'VS').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('vi');
  function save() {
    if (form.busy) return;
    if (!name.trim()) { form.setError(t("Vui lòng nhập họ tên.")); return; }
    Keyboard.dismiss();
    void form.run(async () => {
      const { error } = await requireSupabase().auth.updateUser({ data: { full_name: name.trim(), specialty: specialty.trim(), workplace: workplace.trim() } });
      if (error) throw error;
      form.setMessage(t("Đã cập nhật thông tin tài khoản."));
    });
  }

  function confirmSignOut() {
    Alert.alert(t("Đăng xuất tài khoản?"), t("Phiên đăng nhập trên thiết bị này sẽ được xóa."), [
      { text: t("Ở lại"), style: 'cancel' },
      { text: t("Đăng xuất"), style: 'destructive', onPress: () => { void auth.signOut(); } },
    ]);
  }

  return <AccountScreen title={t("Thông tin tài khoản")} subtitle={t("Quản lý thông tin cá nhân và cơ sở làm việc của bạn.")}>
    <View style={styles.identity}>
      <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
      <View style={styles.identityText}><Text style={styles.email} selectable>{user?.email || ''}</Text><Text style={styles.verified}>{t("✓ Email đã xác nhận")}</Text></View>
    </View>
    {user ? <ProfileLogo key={user.id} ownerId={user.id} disabled={form.busy} /> : null}
    <View style={accountStyles.group}>
      <Text style={accountStyles.section}>{t("Thông tin cá nhân")}</Text>
      <AccountField label={t("Họ và tên")} value={name} onChangeText={(value) => { setName(value); form.setError(''); form.setMessage(''); }} onActivity={auth.recordActivity} autoCapitalize="words" maxLength={100} placeholder={t("Nhập họ và tên")} editable={!form.busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => specialtyInput.current?.focus()} />
    </View>
    <View style={accountStyles.divider} />
    <View style={accountStyles.group}>
      <Text style={accountStyles.section}>{t("Thông tin chuyên môn")}</Text>
      <Text style={accountStyles.body}>{t("Không bắt buộc, bạn có thể bổ sung sau.")}</Text>
      <AccountField label={t("Chuyên khoa")} inputRef={specialtyInput} value={specialty} onChangeText={(value) => { setSpecialty(value); form.setMessage(''); }} onActivity={auth.recordActivity} autoCapitalize="sentences" maxLength={120} placeholder={t("Ví dụ: Tai mũi họng")} editable={!form.busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => workplaceInput.current?.focus()} />
      <AccountField label={t("Cơ sở làm việc")} inputRef={workplaceInput} value={workplace} onChangeText={(value) => { setWorkplace(value); form.setMessage(''); }} onActivity={auth.recordActivity} autoCapitalize="words" maxLength={160} placeholder={t("Tên cơ sở làm việc")} editable={!form.busy} returnKeyType="done" onSubmitEditing={save} />
    </View>
    <Notice error>{form.error}</Notice><Notice>{form.message}</Notice>
    <Button onPress={save} loading={form.busy}>{t("Lưu thay đổi")}</Button>
    <View style={accountStyles.divider} />
    <AccountLink danger onPress={confirmSignOut} disabled={form.busy}>{t("Đăng xuất tài khoản")}</AccountLink>
  </AccountScreen>;
}
const styles = StyleSheet.create({
  identity: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#DCE4EB', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }, initials: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  identityText: { flex: 1, gap: 5 }, email: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '600' }, verified: { color: colors.success, fontSize: 13, lineHeight: 21 },
});
