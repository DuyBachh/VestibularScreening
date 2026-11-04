import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { RouteButton } from '../../components/RouteButton';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthSetupNotice } from '../../features/auth/AuthFeedback';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { normalizeEmail, validateEmail } from '../../features/auth/validation';

export default function LoginScreen() {
  const auth = useAuth();
  const router = useRouter();
  const form = useAuthForm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  if (auth.recovery) return <Redirect href="/reset-password" />;
  if (auth.isSignedIn) return <Redirect href="/" />;

  function submit() {
    const error = validateEmail(email) || (!password ? 'Vui lòng nhập mật khẩu.' : '');
    if (error) { form.setError(error); return; }
    void form.run(async () => { await auth.signIn(normalizeEmail(email), password); setPassword(''); });
  }

  return <Screen title="Chào mừng trở lại" subtitle="Đăng nhập để sử dụng tài khoản của bạn.">
    <AuthSetupNotice />
    <Notice>{auth.notice}</Notice>
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="ban@example.com" editable={!form.busy} />
    <Field label="Mật khẩu" password value={password} onChangeText={setPassword} autoComplete="current-password" textContentType="password" editable={!form.busy} onSubmitEditing={submit} />
    <Notice error>{form.error}</Notice>
    <Button onPress={submit} loading={form.busy} disabled={!auth.isConfigured}>Đăng nhập</Button>
    <RouteButton href="/forgot-password">Quên mật khẩu</RouteButton>
    <RouteButton href="/register">Tạo tài khoản / Xác nhận email</RouteButton>
    <Button secondary disabled={form.busy} onPress={() => { auth.enterPreview(); router.replace('/'); }}>Xem giao diện · Chưa đăng nhập</Button>
  </Screen>;
}
