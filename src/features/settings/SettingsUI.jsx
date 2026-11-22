import { useLanguage } from '../language/LanguageProvider';
import { Children } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

/** @param {{title: string, children: import('react').ReactNode}} props */
export function SettingsGroup({ title, children }) {
  useLanguage();
  const rows = Children.toArray(children);
  return <View style={styles.group}>
    <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
    <View style={styles.card}>{rows.map((child, index) => <View key={index} style={index ? styles.divider : undefined}>{child}</View>)}</View>
  </View>;
}
/** @param {{title: string, subtitle?: string, onPress: () => void, danger?: boolean, loading?: boolean, disabled?: boolean, expanded?: boolean}} props */
export function SettingsRow({ title, subtitle = '', onPress, danger = false, loading = false, disabled = false, expanded }) {
  useLanguage();
  const inactive = loading || disabled;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}${subtitle ? `. ${subtitle}` : ''}`}
    accessibilityState={{ disabled: inactive, busy: loading, ...(expanded === undefined ? {} : { expanded }) }} disabled={inactive} onPress={onPress}
    style={({ pressed }) => [styles.row, pressed && styles.pressed, inactive && styles.inactive]}>
    <View style={styles.text}><Text style={[styles.title, danger && styles.danger]}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>
    {loading ? <ActivityIndicator color={danger ? colors.danger : colors.primary} /> : <Text accessible={false} style={[styles.arrow, danger && styles.danger]}>{expanded === undefined ? '›' : expanded ? '−' : '+'}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({
  group: { gap: 9 }, heading: { color: colors.muted, fontSize: 14, lineHeight: 21, fontWeight: '600', paddingHorizontal: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: '#DCE4EB', overflow: 'hidden' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DCE4EB' },
  row: { minHeight: 72, paddingVertical: 15, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 14 },
  text: { flex: 1, gap: 4 }, title: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '600' }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  arrow: { color: '#52667A', fontSize: 25, lineHeight: 30 }, danger: { color: colors.danger }, pressed: { backgroundColor: colors.tint }, inactive: { opacity: 0.6 },
});
