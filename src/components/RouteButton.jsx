import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/theme';

/** @param {{ href: import('expo-router').Href, children: import('react').ReactNode }} props */
export function RouteButton({ href, children }) {
  return <Link href={href} asChild><Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}><Text style={styles.text}>{children}</Text></Pressable></Link>;
}
const styles = StyleSheet.create({
  button: { minHeight: 54, padding: 16, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontSize: 17, lineHeight: 25, fontWeight: '700', textAlign: 'center' },
});
