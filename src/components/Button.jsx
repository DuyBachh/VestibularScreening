import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/theme';

/** @param {{ children: import('react').ReactNode, onPress: () => void, loading?: boolean, disabled?: boolean, secondary?: boolean }} props */
export function Button({ children, onPress, loading = false, disabled = false, secondary = false }) {
  const inactive = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, inactive && styles.disabled, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={secondary ? colors.primary : '#FFFFFF'} /> : null}
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 54, padding: 15, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  label: { color: '#FFFFFF', fontSize: 17, lineHeight: 25, fontWeight: '700', textAlign: 'center' },
  secondaryLabel: { color: colors.primary },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
});
