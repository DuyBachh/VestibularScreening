import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { colors } from '../../constants/theme';
import { useAuth } from '../../features/auth/AuthProvider';
import { supportedTests } from '../../features/tests/catalog';
import { testPresentation } from '../../features/tests/testPresentation';
import { SettingsGroup, SettingsRow } from '../../features/settings/SettingsUI';

export default function HomeScreen() {
  useLanguage();
  const auth = useAuth();
  const user = auth.session?.user;
  const fullName = String(user?.user_metadata.full_name || '').trim();
  const accountLabel = fullName || user?.email || t("Chế độ xem trước");
  const greetingName = fullName || t("bạn");
  const initials = fullName
    ? fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('vi')
    : String(user?.email?.[0] || 'VS').toLocaleUpperCase('vi');

  function confirmSignOut() {
    Alert.alert(t("Đăng xuất tài khoản?"), t("Phiên đăng nhập trên thiết bị này sẽ được xóa."), [
      { text: t("Ở lại"), style: 'cancel' },
      { text: t("Đăng xuất"), style: 'destructive', onPress: () => { void auth.signOut(); } },
    ]);
  }

  return <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentInsetAdjustmentBehavior="automatic">
      <View style={styles.accountRow}>
        <Link href={auth.isSignedIn ? '/profile' : '/login'} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={auth.isSignedIn ? t("Xem thông tin tài khoản") : t("Đăng nhập tài khoản")} style={styles.accountLink}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.accountTextGroup}>
              <Text numberOfLines={1} style={styles.accountName}>{auth.isSignedIn ? accountLabel : t("Tài khoản")}</Text>
              <Text style={styles.accountAction}>{auth.isSignedIn ? t("Thông tin tài khoản") : t("Đăng nhập / Đăng ký")}</Text>
            </View>
            <Text style={styles.accountChevron}>›</Text>
          </Pressable>
        </Link>
        {auth.isSignedIn ? <Pressable accessibilityRole="button" accessibilityLabel={t("Đăng xuất")} onPress={confirmSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>{t("Đăng xuất")}</Text>
        </Pressable> : null}
      </View>

      <View style={styles.headingGroup}>
        <Text style={styles.brand}>{t("VESTIBULAR SCREENING · ĐỒ ÁN")}</Text>
        <Text accessibilityRole="header" style={styles.title}>{t("Chào, ")}{greetingName} 👋</Text>
        <Text style={styles.subtitle}>{t("Sàng lọc tiền đình · không gian thực hành")}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroKicker}>{t("BẮT ĐẦU TẠI ĐÂY")}</Text>
        <Text style={styles.heroTitle}>{t("Chọn bài kiểm tra")}</Text>
        <Text style={styles.heroDescription}>{t("Xem hướng dẫn trước khi bắt đầu từng bài.")}</Text>
        <Link href="/tests" asChild>
          <Pressable accessibilityRole="button" style={styles.heroButton}>
            <Text style={styles.heroButtonText}>{t("Xem tất cả bài kiểm tra")}</Text>
            <Text style={styles.heroArrow}>›</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.sectionGroup}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t("Bài kiểm tra có sẵn")}</Text>
          <Link href="/tests" asChild><Pressable accessibilityRole="button"><Text style={styles.sectionLink}>{t("Xem tất cả")}</Text></Pressable></Link>
        </View>
        <View style={styles.testList}>
          {supportedTests.map((test, index) => <Link key={test.id} href={{ pathname: '/tests/[id]', params: { id: test.id } }} asChild>
            <Pressable accessibilityRole="button" style={styles.testRow}>
              <View style={styles.testNumber}><Text style={styles.testNumberText}>0{index + 1}</Text></View>
              <View style={styles.testInfo}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={styles.testDescription}>{testPresentation(test.id).title}</Text>
              </View>
              <Text style={styles.testArrow}>›</Text>
            </Pressable>
          </Link>)}
        </View>
      </View>

      <SettingsGroup title={t("Hồ sơ và kết quả")}>
        <SettingsRow title={t("Hồ sơ bệnh nhân")} subtitle={auth.isSignedIn ? t("Tạo, tìm kiếm và quản lý hồ sơ mẫu") : t("Đăng nhập để quản lý hồ sơ mẫu")} onPress={() => router.push(auth.isSignedIn ? '/patients' : '/login')} />
        <SettingsRow title={t("Lịch sử kiểm tra")} subtitle={auth.isSignedIn ? t("Xem lượt đã lưu, ghi chú và báo cáo PDF") : t("Đăng nhập để xem các lượt đã lưu")} onPress={() => router.push(auth.isSignedIn ? '/history' : '/login')} />
      </SettingsGroup>
      <SettingsGroup title={t("Làm quen và hỗ trợ")}>
        <SettingsRow title={t("Thử Demo")} subtitle={t("Trải nghiệm với hồ sơ mẫu, không lưu tài khoản")} onPress={() => router.push('/demo')} />
        <SettingsRow title={t("Hướng dẫn sử dụng")} subtitle={t("Tìm nhanh cách chạy bài và lưu kết quả")} onPress={() => router.push('/guide')} />
        <SettingsRow title={t("Cài đặt và hỗ trợ")} subtitle={t("Tài khoản, dữ liệu, đăng xuất và góp ý")} onPress={() => router.push('/settings')} />
      </SettingsGroup>
      <Text style={styles.disclaimer}>{t("Nguyên mẫu học tập · Không dùng để chẩn đoán y tế.")}</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 20, gap: 20, paddingBottom: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountLink: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.tint },
  avatarText: { color: colors.primary, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  accountTextGroup: { flex: 1, minWidth: 0, gap: 2 },
  accountName: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  accountAction: { color: colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  accountChevron: { color: colors.primary, fontSize: 22, lineHeight: 27 },
  signOutButton: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.dangerTint },
  signOutText: { color: colors.danger, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  headingGroup: { gap: 5 },
  brand: { color: colors.primary, fontSize: 12, lineHeight: 17, fontWeight: '700', letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: 28, lineHeight: 35, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  hero: { padding: 16, gap: 8, borderRadius: 18, backgroundColor: colors.primary },
  heroKicker: { color: '#D9EDF2', fontSize: 11, lineHeight: 15, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { color: '#FFFFFF', fontSize: 19, lineHeight: 25, fontWeight: '700' },
  heroDescription: { color: '#F1F7F8', fontSize: 14, lineHeight: 20 },
  heroButton: { minHeight: 48, marginTop: 2, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 11, backgroundColor: colors.surface },
  heroButtonText: { color: colors.primary, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  heroArrow: { color: colors.primary, fontSize: 24, lineHeight: 28 },
  sectionGroup: { gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  sectionLink: { color: colors.primary, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  testList: { gap: 9 },
  testRow: { minHeight: 74, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  testNumber: { width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.tint },
  testNumberText: { color: colors.primary, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  testInfo: { flex: 1, minWidth: 0, gap: 3 },
  testName: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  testDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  testArrow: { color: colors.primary, fontSize: 24, lineHeight: 28 },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
