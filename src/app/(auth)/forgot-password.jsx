import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { AccountField, AccountLink, AccountScreen, ResendLink, accountStyles as styles } from '../../features/auth/AccountUI';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { AuthSetupNotice } from '../../features/auth/AuthFeedback';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { normalizeEmail, validateEmail, validateOtp } from '../../features/auth/validation';
import { requireSupabase } from '../../services/supabase';

export default function ForgotPasswordScreen() {
  useLanguage();
  const auth = useAuth();
  const form = useAuthForm();
  const router = useRouter();
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [nextSend, setNextSend] = useState(0);
  if (auth.recovery) return <Redirect href="/reset-password" />;

  function sendEmail() {
    if (form.busy || !auth.isConfigured) return;
    const error = validateEmail(email);
    if (error) { form.setError(error); return; }
    if (Date.now() < nextSend) { form.setError(t("Vui lòng đợi đủ 60 giây trước khi yêu cầu email tiếp theo.")); return; }
    Keyboard.dismiss();
    void form.run(async () => {
      const { error: failure } = await requireSupabase().auth.resetPasswordForEmail(normalizeEmail(email));
      if (failure) throw failure;
      setNextSend(Date.now() + 60_000);
      setStage('verify');
      form.setMessage(t("Nếu email có tài khoản, dịch vụ sẽ gửi email khôi phục. Kiểm tra hộp thư và thư rác, rồi nhập mã bên dưới."));
    });
  }

  function verify() {
    if (form.busy || !auth.isConfigured) return;
    const error = validateEmail(email) || validateOtp(token);
    if (error) { form.setError(error); return; }
    Keyboard.dismiss();
    void form.run(async () => {
      await auth.verifyRecovery(normalizeEmail(email), token.trim());
      setToken(''); router.replace('/reset-password');
    });
  }

  return <AccountScreen title={stage === 'email' ? t("Quên mật khẩu?") : t("Nhập mã khôi phục")} step={stage === 'email' ? t("Bước 1 / 3 · Nhận mã") : t("Bước 2 / 3 · Xác nhận mã")} subtitle={stage === 'email' ? t("Nhập email tài khoản để nhận mã đặt lại mật khẩu.") : t("Kiểm tra hộp thư và thư rác, rồi nhập mã từ email khôi phục.")}>
    <AuthSetupNotice />
    <View style={styles.group}>
      <AccountField label={t("Email tài khoản")} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="ban@example.com" editable={!form.busy} returnKeyType="go" onSubmitEditing={stage === 'email' ? sendEmail : undefined} />
      {stage === 'verify' ? <AccountField label={t("Mã khôi phục")} value={token} onChangeText={setToken} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" placeholder={t("Nhập mã")} maxLength={10} editable={!form.busy} style={styles.otp} /> : null}
    </View>
    <Notice error>{form.error}</Notice><Notice>{form.message}</Notice>
    <Button onPress={stage === 'email' ? sendEmail : verify} loading={form.busy} disabled={!auth.isConfigured}>{stage === 'email' ? t("Gửi mã khôi phục") : t("Xác nhận và tiếp tục")}</Button>
    {stage === 'verify' ? <>
      <ResendLink key={nextSend} deadline={nextSend} busy={form.busy || !auth.isConfigured} onPress={sendEmail} />
      <Text style={styles.body}>{t("Sau khi xác nhận, bạn sẽ đặt mật khẩu mới ở bước tiếp theo.")}</Text>
    </> : <AccountLink disabled={form.busy} onPress={() => { setStage('verify'); form.setError(''); form.setMessage(''); }}>{t("Tôi đã có mã khôi phục")}</AccountLink>}
    <View style={styles.divider} />
    <AccountLink disabled={form.busy} onPress={() => router.replace('/login')}>{t("Quay lại đăng nhập")}</AccountLink>
  </AccountScreen>;
}
