import { useLanguage } from '../features/language/LanguageProvider';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

/** @param {{ title: string, children: import('react').ReactNode }} props */
export function Card({ title, children }) {
  useLanguage();
  return <View style={styles.card}><Text style={styles.title}>{title}</Text><Text style={styles.body}>{children}</Text></View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, gap: 8 },
  title: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, lineHeight: 25, color: colors.muted },
});
