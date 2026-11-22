import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { useRef, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { AccountField, AccountLink, AccountScreen, accountStyles as styles } from '../../features/auth/AccountUI';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { validateNewPassword } from '../../features/auth/validation';

export default function ResetPasswordScreen() {
  useLanguage();
  const auth = useAuth();
  const form = useAuthForm();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  /** @type {import('react').RefObject<import('react').ComponentRef<typeof import('react-native').TextInput> | null>} */
  const confirmationInput = useRef(null);
  if (!auth.recovery) return <Redirect href="/login" />;
  function submit() {
    if (form.busy) return;
    const error = validateNewPassword(password, confirmation);
    if (error) { form.setError(error); return; }
    Keyboard.dismiss();
    void form.run(async () => {
      await auth.updatePassword(password);
      setPassword(''); setConfirmation('');
    });
  }
  return <AccountScreen title={t("Đặt mật khẩu mới")} step={t("Bước 3 / 3 · Mật khẩu mới")} subtitle={t("Tạo mật khẩu mới, sau đó đăng nhập lại để tiếp tục.")}>
    <View style={styles.group}>
      <AccountField label={t("Mật khẩu mới")} password value={password} onChangeText={setPassword} onActivity={auth.recordActivity} textContentType="newPassword" autoComplete="new-password" placeholder={t("Nhập mật khẩu mới")} editable={!form.busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmationInput.current?.focus()} />
      <Text style={styles.body}>{t("Sử dụng ít nhất 8 ký tự.")}</Text>
      <AccountField label={t("Nhập lại mật khẩu mới")} inputRef={confirmationInput} password value={confirmation} onChangeText={setConfirmation} onActivity={auth.recordActivity} textContentType="newPassword" autoComplete="new-password" placeholder={t("Nhập lại mật khẩu mới")} editable={!form.busy} returnKeyType="go" onSubmitEditing={submit} />
    </View>
    <Notice error>{form.error}</Notice>
    <Button onPress={submit} loading={form.busy}>{t("Lưu mật khẩu mới")}</Button>
    <AccountLink disabled={form.busy} onPress={() => { void auth.signOut(t("Đã hủy khôi phục mật khẩu.")); }}>{t("Hủy khôi phục")}</AccountLink>
  </AccountScreen>;
}
