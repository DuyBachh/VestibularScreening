import { t } from '../features/language/language.js';
import { useLanguage, LanguageProvider } from '../features/language/LanguageProvider';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { patientTrash } from '../services/patientDatabase';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { colors } from '../constants/theme';

export default function RootLayout() {
  useLanguage();
  return <LanguageProvider><SafeAreaProvider><AuthProvider><AppNavigator /></AuthProvider></SafeAreaProvider></LanguageProvider>;
}

function AppNavigator() {
  useLanguage();
  const auth = useAuth();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  useEffect(() => {
    if (!owner) return;
    const clean = () => { void patientTrash.purgeExpired(owner).catch(() => { /* Retry when opening the trash; preserve data on failure. */ }); };
    clean();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') clean(); });
    return () => subscription.remove();
  }, [owner]);
  if (auth.loading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>{t("Đang kiểm tra phiên đăng nhập…")}</Text></View>;
  }
  return <View style={styles.root} onTouchStart={auth.recordActivity}>
    <StatusBar style="dark" />
    <View style={styles.root} pointerEvents={auth.endingSession ? 'none' : 'auto'} accessibilityElementsHidden={auth.endingSession}>
      <Stack screenOptions={{ headerTransparent: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background }, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Protected guard={(auth.isSignedIn || auth.preview) && !auth.recovery} redirectTo="/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: t("Cài đặt") }} />
        <Stack.Screen name="feedback" options={{ title: t("Báo lỗi và góp ý"), headerShadowVisible: false, headerStyle: { backgroundColor: '#FAFCFD' } }} />
        <Stack.Screen name="guide" options={{ title: t("Hướng dẫn sử dụng") }} />
        <Stack.Screen name="demo" options={{ title: t("Demo không lưu dữ liệu") }} />
        <Stack.Screen name="analysis" options={{ title: t('Phân tích dữ liệu mắt') }} />
        <Stack.Screen name="tests/[id]" options={{ title: t("Thông tin bài kiểm tra") }} />
        <Stack.Screen name="battery" options={{ title: t("Chuỗi 6 bài") }} />
      </Stack.Protected>
      <Stack.Protected guard={auth.isSignedIn} redirectTo="/login">
        <Stack.Screen name="profile" options={{ title: t("Tài khoản của tôi"), headerShadowVisible: false, headerStyle: { backgroundColor: '#FAFCFD' } }} />
        <Stack.Screen name="patients/new" options={{ title: t("Thêm bệnh nhân") }} />
        <Stack.Screen name="patients/trash" options={{ title: t("Thùng rác") }} />
        <Stack.Screen name="patients/[id]" options={{ title: t("Hồ sơ bệnh nhân") }} />
        <Stack.Screen name="patient-history/[id]" options={{ title: t("Lịch sử bệnh nhân") }} />
        <Stack.Screen name="sessions/[id]" options={{ title: t("Chi tiết lượt kiểm tra") }} />
        <Stack.Screen name="compare" options={{ title: t("So sánh lượt kiểm tra") }} />
        <Stack.Screen name="activity" options={{ title: t('Nhật ký hoạt động') }} />
      </Stack.Protected>
      </Stack>
    </View>
    {auth.endingSession ? <View style={styles.overlay}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>{t("Đang kết thúc phiên…")}</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24, backgroundColor: colors.background },
  loadingText: { fontSize: 17, color: colors.text },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 16 },
});
