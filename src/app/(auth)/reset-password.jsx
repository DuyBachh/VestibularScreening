import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { validateNewPassword } from '../../features/auth/validation';

export default function ResetPasswordScreen() {
  const auth = useAuth();
  const form = useAuthForm();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  if (!auth.recovery) return <Redirect href="/login" />;
  function submit() {
    const error = validateNewPassword(password, confirmation);
    if (error) { form.setError(error); return; }
    void form.run(async () => {
      await auth.updatePassword(password);
      setPassword(''); setConfirmation('');
    });
  }
  return <Screen title="Đặt mật khẩu mới" subtitle="Sau khi cập nhật, hãy đăng nhập lại bằng mật khẩu mới.">
    <Field label="Mật khẩu mới · ít nhất 8 ký tự" password value={password} onChangeText={setPassword} onActivity={auth.recordActivity} textContentType="newPassword" autoComplete="new-password" editable={!form.busy} />
    <Field label="Nhập lại mật khẩu mới" password value={confirmation} onChangeText={setConfirmation} onActivity={auth.recordActivity} textContentType="newPassword" autoComplete="new-password" editable={!form.busy} />
    <Notice error>{form.error}</Notice>
    <Button onPress={submit} loading={form.busy}>Cập nhật mật khẩu</Button>
    <Button secondary disabled={form.busy} onPress={() => { void auth.signOut('Đã hủy khôi phục mật khẩu.'); }}>Hủy khôi phục</Button>
  </Screen>;
}
