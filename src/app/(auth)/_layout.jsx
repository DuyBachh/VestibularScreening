import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerTransparent: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background }, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="login" options={{ title: 'Tài khoản' }} /><Stack.Screen name="register" options={{ title: 'Đăng ký' }} /><Stack.Screen name="forgot-password" options={{ title: 'Quên mật khẩu' }} /></Stack>;
}
