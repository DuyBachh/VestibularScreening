import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { colors } from '../../constants/theme';

/** @param {{name: import('expo-symbols').SymbolViewProps['name'], color: import('react-native').ColorValue, target?: boolean}} props */
function TabIcon({ name, color, target = false }) {
  useLanguage();
  return <View accessible={false} style={styles.icon}>
    <SymbolView name={name} size={21} weight="regular" tintColor={color} style={styles.symbol} />
    {target ? <View style={[styles.targetDot, { backgroundColor: color }]} /> : null}
  </View>;
}
export default function TabLayout() {
  useLanguage();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{
    tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#526F85', tabBarLabelPosition: 'below-icon',
    tabBarLabel: ({ focused, color, children }) => <Text maxFontSizeMultiplier={1.3} style={[styles.label, { color, fontWeight: focused ? '700' : '400' }]}>{children}</Text>,
    tabBarItemStyle: styles.item,
    headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
    tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DCE4EB', height: 64 + insets.bottom, paddingTop: 7, paddingBottom: Math.max(insets.bottom, 8), elevation: 0, shadowOpacity: 0 },
  }}>
    <Tabs.Screen name="index" options={{ title: t("Trang chủ"), tabBarIcon: ({ color }) => <TabIcon color={color} name={{ ios: 'house', android: 'home', web: 'home' }} /> }} />
    <Tabs.Screen name="patients" options={{ title: t("Bệnh nhân"), headerShown: false, tabBarIcon: ({ color }) => <TabIcon color={color} name={{ ios: 'person.2', android: 'group', web: 'group' }} /> }} />
    <Tabs.Screen name="tests" options={{ title: t("Kiểm tra"), tabBarIcon: ({ color }) => <TabIcon color={color} target name={{ ios: 'viewfinder', android: 'crop_free', web: 'crop_free' }} /> }} />
    <Tabs.Screen name="history" options={{ title: t("Lịch sử"), tabBarIcon: ({ color }) => <TabIcon color={color} name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }} /> }} />
  </Tabs>;
}
const styles = StyleSheet.create({
  item: { paddingHorizontal: 2 }, icon: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' }, symbol: { width: 21, height: 21 },
  targetDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  label: { fontSize: 11, lineHeight: 16, marginTop: 3, textAlign: 'center' },
});
