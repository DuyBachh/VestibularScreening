import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { LanguageSwitch } from '../../features/language/LanguageSwitch';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { Redirect, useRouter } from 'expo-router';
import { Field } from '../../components/Field';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAuthForm } from '../../features/auth/useAuthForm';
import { normalizeEmail, validateEmail } from '../../features/auth/validation';

export default function LoginScreen() {
  useLanguage();
  const auth = useAuth();
  const router = useRouter();
  const form = useAuthForm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState('');
  /** @type {import('react').RefObject<import('react').ComponentRef<typeof import('react-native').TextInput> | null>} */
  const passwordInput = useRef(null);
  if (auth.recovery) return <Redirect href="/reset-password" />;
  if (auth.isSignedIn) return <Redirect href="/" />;

  function submit() {
    if (form.busy || !auth.isConfigured) return;
    const error = validateEmail(email) || (!password ? t("Vui lòng nhập mật khẩu.") : '');
    if (error) { form.setError(error); return; }
    Keyboard.dismiss();
    void form.run(async () => { await auth.signIn(normalizeEmail(email), password); setPassword(''); });
  }

  /** @param {'/demo' | '/guide' | '/'} path */
  function openPreview(path) {
    if (form.busy) return;
    Keyboard.dismiss();
    auth.enterPreview();
    router.replace(path);
  }

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'android' ? 'height' : undefined} enabled={Platform.OS === 'android'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <View style={styles.page}>
          <View style={styles.topRow}><View style={styles.brandRow}>
            <View style={styles.brandMark} accessible={false}><View style={styles.brandRing}><View style={styles.brandDot} /></View></View>
            <View style={styles.brandText}><Text style={styles.brandTitle}>Vestibular</Text><Text style={styles.brandSubtitle}>SCREENING</Text></View>
          </View><View style={styles.languageSlot}><LanguageSwitch showLabel={false} /></View></View>

          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>{t("Đăng nhập")}</Text>
            <Text style={styles.subtitle}>{t("Tiếp tục với hồ sơ và lịch sử của bạn.")}</Text>
          </View>

          <View style={styles.form}>
            {!auth.isConfigured ? <Notice>{t("Đăng nhập hiện chưa sẵn sàng. Bạn có thể trải nghiệm ứng dụng bằng Demo bên dưới.")}</Notice> : null}
            <Notice>{auth.notice}</Notice>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="ban@example.com" editable={!form.busy}
              returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} submitBehavior="submit"
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')} inputContainerStyle={[styles.input, focused === 'email' && styles.inputFocused]} />
            <Field label={t("Mật khẩu")} password inputRef={passwordInput} value={password} onChangeText={setPassword} autoComplete="current-password" textContentType="password" placeholder={t("Nhập mật khẩu")} editable={!form.busy}
              returnKeyType="go" onSubmitEditing={submit} onFocus={() => setFocused('password')} onBlur={() => setFocused('')} inputContainerStyle={[styles.input, focused === 'password' && styles.inputFocused]} />
            <Pressable accessibilityRole="link" disabled={form.busy} onPress={() => router.push('/forgot-password')} style={({ pressed }) => [styles.forgot, pressed && styles.pressed]}>
              <Text style={styles.linkText}>{t("Quên mật khẩu?")}</Text>
            </Pressable>
            <Notice error>{form.error}</Notice>
            <Button onPress={submit} loading={form.busy} disabled={!auth.isConfigured}>{t("Đăng nhập")}</Button>
            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>{t("Chưa có tài khoản?")}</Text>
              <Pressable accessibilityRole="link" accessibilityLabel={t("Đăng ký hoặc xác nhận email")} disabled={form.busy} onPress={() => router.push('/register')} style={({ pressed }) => [styles.textLink, pressed && styles.pressed]}><Text style={styles.linkText}>{t("Đăng ký")}</Text></Pressable>
            </View>
          </View>

          <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerLabel}>{t("Khám phá ứng dụng")}</Text><View style={styles.divider} /></View>
          <Pressable accessibilityRole="button" accessibilityLabel={t("Thử demo, không cần tài khoản, không lưu dữ liệu")} disabled={form.busy} onPress={() => openPreview('/demo')} style={({ pressed }) => [styles.demoCard, pressed && styles.pressed, form.busy && styles.disabled]}>
            <View style={styles.demoText}><Text style={styles.demoTitle}>{t("Thử demo")}</Text><Text style={styles.demoSubtitle}>{t("Không cần tài khoản · Không lưu dữ liệu")}</Text></View>
            <Text style={styles.arrow} accessible={false}>→</Text>
          </Pressable>
          <View style={styles.helpRow}>
            <Pressable accessibilityRole="link" disabled={form.busy} onPress={() => openPreview('/guide')} style={({ pressed }) => [styles.textLink, pressed && styles.pressed]}><Text style={styles.helpText}>{t("Hướng dẫn sử dụng")}</Text></Pressable>
            <Pressable accessibilityRole="link" disabled={form.busy} onPress={() => openPreview('/')} style={({ pressed }) => [styles.textLink, pressed && styles.pressed]}><Text style={styles.helpText}>{t("Xem trước trang chủ")}</Text></Pressable>
          </View>
          <Text style={styles.footer}>{t("Nguyên mẫu học tập · Không dùng để chẩn đoán.")}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFCFD' }, fill: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  page: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 28 }, languageSlot: { flexGrow: 1, alignItems: 'flex-end' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  brandRing: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  brandText: { gap: 2 }, brandTitle: { color: colors.text, fontSize: 23, lineHeight: 28, fontWeight: '700' }, brandSubtitle: { color: colors.primary, fontSize: 11, lineHeight: 16, letterSpacing: 2.5, fontWeight: '600' },
  heading: { gap: 8, marginBottom: 28 }, title: { color: colors.text, fontSize: 32, lineHeight: 40, fontWeight: '700' }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  form: { gap: 16 }, input: { borderColor: '#CBD5DF', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5 }, inputFocused: { borderColor: colors.primary },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, marginTop: -12, marginBottom: -4 },
  linkText: { color: colors.primary, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', columnGap: 6, marginTop: -4 }, registerPrompt: { color: colors.muted, fontSize: 15, lineHeight: 23 }, textLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: 20 }, divider: { height: 1, flex: 1, backgroundColor: '#DCE4EB' }, dividerLabel: { color: colors.muted, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  demoCard: { backgroundColor: colors.tint, borderRadius: 16, padding: 16, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 }, demoText: { flex: 1, gap: 4 }, demoTitle: { color: colors.primary, fontSize: 17, lineHeight: 24, fontWeight: '700' }, demoSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 20 }, arrow: { color: colors.primary, fontSize: 24 },
  helpRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4, marginTop: 8 }, helpText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  footer: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 20 }, pressed: { opacity: 0.7 }, disabled: { opacity: 0.5 },
});
