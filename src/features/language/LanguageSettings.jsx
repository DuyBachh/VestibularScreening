import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SettingsGroup, SettingsRow } from '../settings/SettingsUI';
import { colors } from '../../constants/theme';
import { useLanguage, saveLanguage } from './LanguageProvider';

export function LanguageSettings() {
  const language = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  /** @param {'vi' | 'en'} value */
  async function choose(value) {
    if (lock.current || value === language) return;
    lock.current = true; setSaving(true); setError(false);
    try { await saveLanguage(value); }
    catch { setError(true); }
    finally { setSaving(false); lock.current = false; }
  }
  return <View style={{ gap: 8 }}><SettingsGroup title={language === 'en' ? 'Language / Ngôn ngữ' : 'Ngôn ngữ / Language'}>
    <SettingsRow title="Tiếng Việt" subtitle={language === 'vi' ? '✓ Đang chọn' : 'Vietnamese'} disabled={saving} onPress={() => { void choose('vi'); }} />
    <SettingsRow title="English" subtitle={language === 'en' ? '✓ Selected' : 'Tiếng Anh'} disabled={saving} onPress={() => { void choose('en'); }} />
  </SettingsGroup>{error ? <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 14, lineHeight: 22 }}>{language === 'en' ? 'Could not save the language. Your previous selection is unchanged. Try again.' : 'Chưa lưu được ngôn ngữ. Lựa chọn trước vẫn giữ nguyên. Hãy thử lại.'}</Text> : null}</View>;
}
