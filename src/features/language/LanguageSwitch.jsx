import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { saveLanguage, useLanguage } from './LanguageProvider';
import { t } from './language';

/** @param {{showLabel?: boolean}} props */
export function LanguageSwitch({ showLabel = true }) {
  const language = useLanguage();
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  /** @param {'vi' | 'en'} value */
  async function choose(value) {
    if (lock.current || value === language) return;
    lock.current = true; setSaving(true);
    try { await saveLanguage(value); }
    catch {
      Alert.alert(t('Chưa đổi được ngôn ngữ'), t('Chưa lưu được ngôn ngữ. Lựa chọn trước vẫn giữ nguyên. Hãy thử lại.'), [{ text: t('Đóng') }]);
    } finally { lock.current = false; setSaving(false); }
  }
  return <View style={styles.row}>
    {showLabel ? <Text style={styles.caption}>{t('Ngôn ngữ')}</Text> : null}
    <View style={styles.control} accessibilityLabel="Ngôn ngữ / Language">
      {/** @type {('vi' | 'en')[]} */ (['vi', 'en']).map((value) => <Pressable key={value} accessibilityRole="button"
        accessibilityLabel={value === 'vi' ? 'Tiếng Việt / Vietnamese' : 'English / Tiếng Anh'}
        accessibilityState={{ selected: language === value, disabled: saving, busy: saving }}
        disabled={saving} onPress={() => { void choose(value); }}
        style={({ pressed }) => [styles.option, language === value && styles.selected, (pressed || saving) && styles.dim]}>
        <Text style={[styles.text, language === value && styles.selectedText]}>{value === 'vi' ? 'VI' : 'EN'}</Text>
      </Pressable>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 9, alignSelf: 'flex-end' },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  control: { flexDirection: 'row', gap: 2, padding: 3, borderWidth: 1, borderColor: '#D7E2E9', borderRadius: 15, backgroundColor: '#FFFFFF' },
  option: { minWidth: 44, minHeight: 44, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.primary }, text: { color: '#52667A', fontSize: 13, lineHeight: 20, fontWeight: '700' }, selectedText: { color: '#FFFFFF' }, dim: { opacity: 0.65 },
});
