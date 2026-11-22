import { t } from '../features/language/language.js';
import { useLanguage } from '../features/language/LanguageProvider';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/theme';

/** @param {import('react-native').TextInputProps & { label: string, password?: boolean, onActivity?: () => void, inputRef?: import('react').Ref<import('react').ComponentRef<typeof import('react-native').TextInput>>, inputContainerStyle?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props */
export function Field({ label, password = false, onActivity, inputRef, inputContainerStyle, ...props }) {
  useLanguage();
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, inputContainerStyle]}>
        <TextInput
          ref={inputRef}
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
          <Pressable accessibilityRole="button" accessibilityLabel={visible ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")} onPress={() => setVisible(!visible)} style={styles.toggle}>
            <Text style={styles.toggleText}>{visible ? t("Ẩn") : t("Hiện")}</Text>
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
