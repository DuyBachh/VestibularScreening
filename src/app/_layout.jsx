import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return <SafeAreaProvider><StatusBar style="dark" /><Stack screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background }, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    <Stack.Screen name="settings" options={{ title: 'Cài đặt' }} />
    <Stack.Screen name="tests/[id]" options={{ title: 'Thông tin bài kiểm tra' }} />
  </Stack></SafeAreaProvider>;
}
