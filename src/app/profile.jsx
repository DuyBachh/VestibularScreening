import { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { Notice } from '../components/Notice';
import { useAuth } from '../features/auth/AuthProvider';
import { useAuthForm } from '../features/auth/useAuthForm';
import { requireSupabase } from '../services/supabase';

export default function ProfileScreen() {
  const auth = useAuth();
  const form = useAuthForm();
  const user = auth.session?.user;
  const [name, setName] = useState(String(user?.user_metadata.full_name || ''));
  const [specialty, setSpecialty] = useState(String(user?.user_metadata.specialty || ''));
  const [workplace, setWorkplace] = useState(String(user?.user_metadata.workplace || ''));

  function save() {
    if (!name.trim()) { form.setError('Vui lòng nhập họ tên.'); return; }
    void form.run(async () => {
      const { error } = await requireSupabase().auth.updateUser({ data: { full_name: name.trim(), specialty: specialty.trim(), workplace: workplace.trim() } });
      if (error) throw error;
      form.setMessage('Đã cập nhật thông tin tài khoản.');
    });
  }

  function confirmSignOut() {
    Alert.alert('Đăng xuất tài khoản?', 'Phiên đăng nhập trên thiết bị này sẽ được xóa.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => { void auth.signOut(); } },
    ]);
  }

  return <Screen title="Thông tin tài khoản" subtitle="Chỉ cập nhật thông tin cá nhân phục vụ đồ án.">
    <Card title="Email đã xác nhận">{user?.email || ''}</Card>
    <Field label="Họ và tên" value={name} onChangeText={setName} onActivity={auth.recordActivity} autoCapitalize="words" maxLength={100} editable={!form.busy} />
    <Field label="Chuyên khoa · không bắt buộc" value={specialty} onChangeText={setSpecialty} onActivity={auth.recordActivity} autoCapitalize="sentences" maxLength={120} editable={!form.busy} />
    <Field label="Cơ sở làm việc · không bắt buộc" value={workplace} onChangeText={setWorkplace} onActivity={auth.recordActivity} autoCapitalize="words" maxLength={160} editable={!form.busy} />
    <Notice error>{form.error}</Notice><Notice>{form.message}</Notice>
    <Button onPress={save} loading={form.busy}>Lưu thông tin</Button>
    <Button secondary onPress={confirmSignOut} disabled={form.busy}>Đăng xuất</Button>
  </Screen>;
}
