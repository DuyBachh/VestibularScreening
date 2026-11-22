import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';
export default function AuthLayout() {
  useLanguage();
  return <Stack screenOptions={{ headerTransparent: false, headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: '#FAFCFD' }, contentStyle: { backgroundColor: '#FAFCFD' } }}>
    <Stack.Screen name="login" options={{ title: t("Đăng nhập"), headerShown: false }} />
    <Stack.Screen name="register" options={{ title: t("Đăng ký") }} />
    <Stack.Screen name="forgot-password" options={{ title: t("Quên mật khẩu") }} />
    <Stack.Screen name="reset-password" options={{ title: t("Mật khẩu mới"), headerBackVisible: false, gestureEnabled: false }} />
  </Stack>;
}
