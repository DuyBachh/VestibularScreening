import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

/** @param {{ title: string, subtitle?: string, children: import('react').ReactNode }} props */
export function Screen({ title, subtitle = '', children }) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>VESTIBULAR SCREENING · ĐỒ ÁN</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}
        {children}
        <Text style={styles.footer}>Nguyên mẫu học tập, không phục vụ chẩn đoán y tế. Chỉ sử dụng thông tin bệnh nhân giả lập.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 18, flexGrow: 1 },
  brand: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  footer: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 12 },
});
