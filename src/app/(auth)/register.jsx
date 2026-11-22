import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { useRef, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { AccountField, AccountLink, AccountScreen, ResendLink, accountStyles as styles } from '../../features/auth/AccountUI';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthSetupNotice } from '../../features/auth/AuthFeedback';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { normalizeEmail, validateEmail, validateNewPassword, validateOtp } from '../../features/auth/validation';
import { requireSupabase } from '../../services/supabase';

export default function RegisterScreen() {
  useLanguage();
  const auth = useAuth();
  const form = useAuthForm();
  const [stage, setStage] = useState('register');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [token, setToken] = useState('');
  const [nextSend, setNextSend] = useState(0);
  /** @type {import('react').RefObject<import('react').ComponentRef<typeof import('react-native').TextInput> | null>} */
  const nameInput = useRef(null);
  /** @type {import('react').RefObject<import('react').ComponentRef<typeof import('react-native').TextInput> | null>} */
  const passwordInput = useRef(null);
  /** @type {import('react').RefObject<import('react').ComponentRef<typeof import('react-native').TextInput> | null>} */
  const confirmationInput = useRef(null);
  if (auth.recovery) return <Redirect href="/reset-password" />;
  if (auth.isSignedIn) return <Redirect href="/" />;

  function register() {
    if (form.busy || !auth.isConfigured) return;
    const error = validateEmail(email) || (!name.trim() ? t("Vui lòng nhập họ tên.") : '') || validateNewPassword(password, confirmation);
    if (error) { form.setError(error); return; }
    Keyboard.dismiss();
    void form.run(async () => {
      const needsConfirmation = await auth.registerAccount(normalizeEmail(email), password, name.trim());
      setPassword(''); setConfirmation('');
      if (!needsConfirmation) {
        form.setMessage(t("Tài khoản đã được tạo. Bạn có thể về màn hình đăng nhập để tiếp tục."));
        return;
      }
      setStage('verify');
      setNextSend(Date.now() + 60_000);
      form.setMessage(t("Kiểm tra hộp thư và thư rác. Nếu tài khoản có thể đăng ký, dịch vụ sẽ gửi email xác nhận."));
    });
  }

  function verify() {
    if (form.busy || !auth.isConfigured) return;
    const error = validateEmail(email) || validateOtp(token);
    if (error) { form.setError(error); return; }
    Keyboard.dismiss();
    void form.run(async () => { await auth.verifySignup(normalizeEmail(email), token.trim()); setToken(''); });
  }

  function resend() {
    if (form.busy || !auth.isConfigured) return;
    const error = validateEmail(email);
    if (error) { form.setError(error); return; }
    if (Date.now() < nextSend) { form.setError(t("Vui lòng đợi đủ 60 giây giữa hai lần gửi mã.")); return; }
    Keyboard.dismiss();
    void form.run(async () => {
      const { error: failure } = await requireSupabase().auth.resend({ type: 'signup', email: normalizeEmail(email) });
      if (failure) throw failure;
      setNextSend(Date.now() + 60_000);
      form.setMessage(t("Đã yêu cầu gửi lại email xác nhận. Vui lòng kiểm tra hộp thư."));
    });
  }

  return <AccountScreen title={stage === 'register' ? t("Tạo tài khoản") : t("Xác nhận email")} step={stage === 'register' ? t("Bước 1 / 2 · Thông tin tài khoản") : t("Bước 2 / 2 · Xác nhận email")} subtitle={stage === 'register' ? t("Tạo tài khoản để quản lý hồ sơ và lưu lượt kiểm tra.") : t("Nhập mã trong email để hoàn tất đăng ký. Kiểm tra cả thư rác nếu chưa thấy thư.")}>
    <AuthSetupNotice />
    <View style={styles.group}>
      <AccountField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="ban@example.com" editable={!form.busy}
        returnKeyType={stage === 'register' ? 'next' : 'done'} submitBehavior="submit" onSubmitEditing={() => { if (stage === 'register') nameInput.current?.focus(); }} />
      {stage === 'register' ? <>
        <AccountField label={t("Họ và tên")} inputRef={nameInput} value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" placeholder={t("Nhập họ và tên")} maxLength={100} editable={!form.busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordInput.current?.focus()} />
        <AccountField label={t("Mật khẩu")} inputRef={passwordInput} password value={password} onChangeText={setPassword} textContentType="newPassword" autoComplete="new-password" placeholder={t("Tạo mật khẩu")} editable={!form.busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmationInput.current?.focus()} />
        <Text style={styles.body}>{t("Sử dụng ít nhất 8 ký tự.")}</Text>
        <AccountField label={t("Nhập lại mật khẩu")} inputRef={confirmationInput} password value={confirmation} onChangeText={setConfirmation} textContentType="newPassword" autoComplete="new-password" placeholder={t("Nhập lại mật khẩu vừa tạo")} editable={!form.busy} returnKeyType="go" onSubmitEditing={register} />
      </> : <AccountField label={t("Mã xác nhận")} value={token} onChangeText={setToken} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" placeholder={t("Nhập mã")} maxLength={10} editable={!form.busy} style={styles.otp} />}
    </View>
    <Notice error>{form.error}</Notice><Notice>{form.message}</Notice>
    <Button onPress={stage === 'register' ? register : verify} loading={form.busy} disabled={!auth.isConfigured}>{stage === 'register' ? t("Tạo tài khoản") : t("Xác nhận và tiếp tục")}</Button>
    {stage === 'verify' ? <ResendLink key={nextSend} deadline={nextSend} busy={form.busy || !auth.isConfigured} onPress={resend} /> : <AccountLink disabled={form.busy} onPress={() => { setStage('verify'); form.setError(''); form.setMessage(''); }}>{t("Đã có mã? Xác nhận email")}</AccountLink>}
    <View style={styles.divider} />
    <AccountLink disabled={form.busy} onPress={() => router.replace('/login')}>{t("Đã có tài khoản? Đăng nhập")}</AccountLink>
  </AccountScreen>;
}
