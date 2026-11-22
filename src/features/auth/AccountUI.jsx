import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { LanguageSwitch } from '../language/LanguageSwitch';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field } from '../../components/Field';
import { colors } from '../../constants/theme';

/** @param {{title: string, subtitle: string, step?: string, children: import('react').ReactNode}} props */
export function AccountScreen({ title, subtitle, step, children }) {
  useLanguage();
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={accountStyles.safe}>
    <KeyboardAvoidingView style={{ flex: 1 }} enabled={Platform.OS === 'android'} behavior={Platform.OS === 'android' ? 'height' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentInsetAdjustmentBehavior="automatic" contentContainerStyle={accountStyles.content}>
        <LanguageSwitch />
        <View style={accountStyles.heading}><Text style={accountStyles.brand}>VESTIBULAR SCREENING</Text>
          {step ? <Text style={accountStyles.step}>{step}</Text> : null}
          <Text accessibilityRole="header" style={accountStyles.title}>{title}</Text><Text style={accountStyles.body}>{subtitle}</Text>
        </View>
        {children}
        <Text style={accountStyles.footer}>{t("Nguyên mẫu học tập · Chỉ dùng dữ liệu giả lập.")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

/** @param {import('react').ComponentProps<typeof Field>} props */
export function AccountField({ onFocus, onBlur, inputContainerStyle, ...props }) {
  useLanguage();
  const [focused, setFocused] = useState(false);
  return <Field {...props} inputContainerStyle={[accountStyles.input, focused && accountStyles.focused, inputContainerStyle]}
    onFocus={(event) => { setFocused(true); onFocus?.(event); }} onBlur={(event) => { setFocused(false); onBlur?.(event); }} />;
}

/** @param {{children: import('react').ReactNode, onPress: () => void, disabled?: boolean, danger?: boolean}} props */
export function AccountLink({ children, onPress, disabled = false, danger = false }) {
  useLanguage();
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress}
    style={({ pressed }) => [accountStyles.link, (pressed || disabled) && { opacity: 0.5 }]}>
    <Text style={[accountStyles.linkText, danger && { color: colors.danger }]}>{children}</Text>
  </Pressable>;
}

/** @param {{deadline: number, busy: boolean, onPress: () => void}} props */
export function ResendLink({ deadline, busy, onPress }) {
  useLanguage();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  return <AccountLink disabled={busy || remaining > 0} onPress={onPress}>{remaining > 0 ? t("Gửi lại mã sau {0} giây", [remaining]) : t("Chưa nhận được mã? Gửi lại")}</AccountLink>;
}

export const accountStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFCFD' }, content: { width: '100%', maxWidth: 488, alignSelf: 'center', flexGrow: 1, padding: 24, gap: 20 },
  heading: { gap: 8, paddingBottom: 6 }, brand: { color: colors.primary, fontSize: 12, letterSpacing: 1.3, fontWeight: '700', marginBottom: 10 },
  step: { color: colors.primary, fontSize: 13, fontWeight: '600' }, title: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: '700' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  input: { borderWidth: 1.5, borderColor: '#CBD5DF', backgroundColor: colors.surface, borderRadius: 14 }, focused: { borderColor: colors.primary },
  group: { gap: 16 }, section: { color: colors.text, fontSize: 18, fontWeight: '700' },
  link: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' }, linkText: { color: colors.primary, fontSize: 15, lineHeight: 23, fontWeight: '600', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#DCE4EB' }, footer: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', paddingTop: 12 },
  otp: { fontSize: 26, letterSpacing: 6, fontVariant: ['tabular-nums'], minHeight: 64 },
});
