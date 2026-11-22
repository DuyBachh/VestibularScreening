import { useLanguage } from '../features/language/LanguageProvider';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

/** @param {{ children?: string, error?: boolean }} props */
export function Notice({ children, error = false }) {
  useLanguage();
  if (!children) return null;
  return <View accessibilityRole={error ? 'alert' : 'text'} accessibilityLiveRegion="polite" style={[styles.box, error && styles.errorBox]}><Text style={[styles.text, error && styles.errorText]}>{children}</Text></View>;
}
const styles = StyleSheet.create({
  box: { backgroundColor: colors.tint, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
  text: { fontSize: 16, lineHeight: 25, color: colors.text },
  errorBox: { backgroundColor: colors.dangerTint, borderLeftColor: colors.danger },
  errorText: { color: colors.danger },
});
