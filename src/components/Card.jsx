import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

/** @param {{ title: string, children: import('react').ReactNode }} props */
export function Card({ title, children }) {
  return <View style={styles.card}><Text style={styles.title}>{title}</Text><Text style={styles.body}>{children}</Text></View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, gap: 8 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 14, lineHeight: 22, color: colors.muted },
});
