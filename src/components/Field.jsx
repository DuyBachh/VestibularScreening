import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/theme';

/** @param {import('react-native').TextInputProps & { label: string, password?: boolean, onActivity?: () => void }} props */
export function Field({ label, password = false, onActivity, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          {...props}
          onChangeText={(text) => { onActivity?.(); props.onChangeText?.(text); }}
          secureTextEntry={password && !visible}
          style={[styles.input, props.style]}
        />
        {password ? (
          <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={() => setVisible(!visible)} style={styles.toggle}>
            <Text style={styles.toggleText}>{visible ? 'Ẩn' : 'Hiện'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  row: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center' },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 15, paddingVertical: 12, fontSize: 17, color: colors.text },
  toggle: { minWidth: 60, minHeight: 54, justifyContent: 'center', alignItems: 'center' },
  toggleText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
