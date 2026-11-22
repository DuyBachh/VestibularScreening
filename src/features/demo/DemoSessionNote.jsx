import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { colors } from '../../constants/theme';

/** @param {{ session: import('./demoData').DemoSession, onAdd: (session: import('./demoData').DemoSession) => void }} props */
export function DemoSessionNote({ session, onAdd }) {
  useLanguage();
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);
  return <View style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.surface }}>
    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{t("Dữ liệu mô phỏng - Demo")}</Text>
    <Text style={{ fontSize: 15, lineHeight: 23, color: colors.muted }}>{t("Lượt này chỉ nằm trong bộ nhớ của màn demo, không lưu vào hồ sơ hoặc lịch sử tài khoản.")}</Text>
    {added ? <Text style={{ fontSize: 16, color: colors.primary }}>{t("Đã thêm lượt thử. Bấm Về Demo rồi mở Các lượt đã thử để xem lại.")}</Text> : <>
      <Field label={t("Ghi chú demo")} value={notes} onChangeText={setNotes} multiline maxLength={1000} style={{ minHeight: 80 }} placeholder={t("Nhập thử, nội dung sẽ mất khi đóng demo")} />
      <Button onPress={() => { onAdd({ ...session, notes }); setAdded(true); }}>{t("Thêm vào danh sách demo")}</Button>
    </>}
  </View>;
}
