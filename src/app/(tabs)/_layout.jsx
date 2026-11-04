import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../constants/theme';

export default function TabLayout() {
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, tabBarStyle: { backgroundColor: colors.surface } }}>
    <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⌂</Text> }} />
    <Tabs.Screen name="patients" options={{ title: 'Bệnh nhân', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>♧</Text> }} />
    <Tabs.Screen name="tests" options={{ title: 'Kiểm tra', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>◎</Text> }} />
    <Tabs.Screen name="history" options={{ title: 'Lịch sử', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>◷</Text> }} />
  </Tabs>;
}
