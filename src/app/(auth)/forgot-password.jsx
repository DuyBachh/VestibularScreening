import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { RouteButton } from '../../components/RouteButton';
import { AuthSetupNotice } from '../../features/auth/AuthFeedback';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { normalizeEmail, validateEmail, validateOtp } from '../../features/auth/validation';
import { requireSupabase } from '../../services/supabase';

export default function ForgotPasswordScreen() {
  const auth = useAuth();
  const form = useAuthForm();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [nextSend, setNextSend] = useState(0);
  if (auth.recovery) return <Redirect href="/reset-password" />;

  function sendEmail() {
    const error = validateEmail(email);
    if (error) { form.setError(error); return; }
    if (Date.now() < nextSend) { form.setError('Vui lòng đợi đủ 60 giây trước khi yêu cầu email tiếp theo.'); return; }
    void form.run(async () => {
      const { error: failure } = await requireSupabase().auth.resetPasswordForEmail(normalizeEmail(email));
      if (failure) throw failure;
      setNextSend(Date.now() + 60_000);
      form.setMessage('Nếu email có tài khoản, dịch vụ sẽ gửi email khôi phục. Kiểm tra hộp thư và thư rác, rồi nhập mã bên dưới.');
    });
  }

  function verify() {
    const error = validateEmail(email) || validateOtp(token);
    if (error) { form.setError(error); return; }
    void form.run(async () => {
      await auth.verifyRecovery(normalizeEmail(email), token.trim());
      setToken(''); router.replace('/reset-password');
    });
  }

  return <Screen title="Khôi phục mật khẩu" subtitle="Nhận email khôi phục, xác nhận mã rồi đặt mật khẩu mới ngay trong ứng dụng.">
    <AuthSetupNotice />
    <Field label="Email tài khoản" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" editable={!form.busy} />
    <Button onPress={sendEmail} loading={form.busy} disabled={!auth.isConfigured}>Gửi email khôi phục</Button>
    <Notice>{form.message}</Notice>
    <Field label="Mã khôi phục trong email" value={token} onChangeText={setToken} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={10} editable={!form.busy} />
    <Notice error>{form.error}</Notice>
    <Button secondary onPress={verify} disabled={form.busy || !auth.isConfigured}>Xác nhận mã và tiếp tục</Button>
    <RouteButton href="/login">Về đăng nhập</RouteButton>
  </Screen>;
}
