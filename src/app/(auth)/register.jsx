import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { RouteButton } from '../../components/RouteButton';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthSetupNotice } from '../../features/auth/AuthFeedback';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { normalizeEmail, validateEmail, validateNewPassword, validateOtp } from '../../features/auth/validation';
import { requireSupabase } from '../../services/supabase';

export default function RegisterScreen() {
  const auth = useAuth();
  const form = useAuthForm();
  const [stage, setStage] = useState('register');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [token, setToken] = useState('');
  const [nextSend, setNextSend] = useState(0);
  if (auth.recovery) return <Redirect href="/reset-password" />;
  if (auth.isSignedIn) return <Redirect href="/" />;

  function register() {
    const error = validateEmail(email) || (!name.trim() ? 'Vui lòng nhập họ tên.' : '') || validateNewPassword(password, confirmation);
    if (error) { form.setError(error); return; }
    void form.run(async () => {
      const needsConfirmation = await auth.registerAccount(normalizeEmail(email), password, name.trim());
      setPassword(''); setConfirmation('');
      if (!needsConfirmation) {
        form.setMessage('Tài khoản đã được tạo nhưng Supabase đang tắt xác nhận email. Bật Confirm email theo hướng dẫn; tài khoản vừa tạo có thể dùng ở màn hình đăng nhập.');
        return;
      }
      setStage('verify');
      setNextSend(Date.now() + 60_000);
      form.setMessage('Kiểm tra hộp thư và thư rác. Nếu tài khoản có thể đăng ký, dịch vụ sẽ gửi email xác nhận.');
    });
  }

  function verify() {
    const error = validateEmail(email) || validateOtp(token);
    if (error) { form.setError(error); return; }
    void form.run(async () => { await auth.verifySignup(normalizeEmail(email), token.trim()); setToken(''); });
  }

  function resend() {
    const error = validateEmail(email);
    if (error) { form.setError(error); return; }
    if (Date.now() < nextSend) { form.setError('Vui lòng đợi đủ 60 giây giữa hai lần gửi mã.'); return; }
    void form.run(async () => {
      const { error: failure } = await requireSupabase().auth.resend({ type: 'signup', email: normalizeEmail(email) });
      if (failure) throw failure;
      setNextSend(Date.now() + 60_000);
      form.setMessage('Đã yêu cầu gửi lại email xác nhận. Vui lòng kiểm tra hộp thư.');
    });
  }

  return <Screen title={stage === 'register' ? 'Tạo tài khoản' : 'Xác nhận email'} subtitle="Dùng email bạn có thể nhận thư. Không dùng thông tin bệnh nhân.">
    <AuthSetupNotice />
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" editable={!form.busy} />
    {stage === 'register' ? <>
      <Field label="Họ và tên" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" maxLength={100} editable={!form.busy} />
      <Field label="Mật khẩu · ít nhất 8 ký tự" password value={password} onChangeText={setPassword} textContentType="newPassword" autoComplete="new-password" editable={!form.busy} />
      <Field label="Nhập lại mật khẩu" password value={confirmation} onChangeText={setConfirmation} textContentType="newPassword" autoComplete="new-password" editable={!form.busy} />
    </> : <>
      <Notice>Nhập mã trong email xác nhận. Nếu email chỉ có nút bấm, cần cấu hình mẫu email theo hướng dẫn dự án để hiện mã.</Notice>
      <Field label="Mã xác nhận" value={token} onChangeText={setToken} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={10} editable={!form.busy} />
    </>}
    <Notice error>{form.error}</Notice><Notice>{form.message}</Notice>
    <Button onPress={stage === 'register' ? register : verify} loading={form.busy} disabled={!auth.isConfigured}>{stage === 'register' ? 'Đăng ký' : 'Xác nhận email'}</Button>
    {stage === 'verify' ? <Button secondary onPress={resend} disabled={form.busy || !auth.isConfigured}>Gửi lại mã · cách nhau 60 giây</Button> : <Button secondary disabled={form.busy} onPress={() => { setStage('verify'); form.setError(''); }}>Tôi đã có mã xác nhận</Button>}
    <RouteButton href="/login">Về đăng nhập</RouteButton>
  </Screen>;
}
