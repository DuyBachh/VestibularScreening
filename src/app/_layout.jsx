import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><AppNavigator /></AuthProvider></SafeAreaProvider>;
}

function AppNavigator() {
  const auth = useAuth();
  if (auth.loading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>Đang kiểm tra phiên đăng nhập…</Text></View>;
  }
  return <View style={styles.root} onTouchStart={auth.recordActivity}>
    <StatusBar style="dark" />
    <View style={styles.root} pointerEvents={auth.endingSession ? 'none' : 'auto'} accessibilityElementsHidden={auth.endingSession}>
      <Stack screenOptions={{ headerTransparent: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background }, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Protected guard={(auth.isSignedIn || auth.preview) && !auth.recovery} redirectTo="/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Cài đặt' }} />
        <Stack.Screen name="tests/[id]" options={{ title: 'Thông tin bài kiểm tra' }} />
      </Stack.Protected>
      <Stack.Protected guard={auth.isSignedIn} redirectTo="/login">
        <Stack.Screen name="profile" options={{ title: 'Tài khoản của tôi' }} />
      </Stack.Protected>
      </Stack>
    </View>
    {auth.endingSession ? <View style={styles.overlay}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Đang kết thúc phiên…</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24, backgroundColor: colors.background },
  loadingText: { fontSize: 17, color: colors.text },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 16 },
});
