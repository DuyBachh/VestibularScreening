import { t } from '../features/language/language.js';
import { useLanguage } from '../features/language/LanguageProvider';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../features/auth/AuthProvider';
import { LanguageSettings } from '../features/language/LanguageSettings';
import { colors } from '../constants/theme';
import { LocalDataRemoval } from '../features/auth/LocalDataRemoval';
import { SettingsGroup, SettingsRow } from '../features/settings/SettingsUI';

export default function SettingsScreen() {
  useLanguage();
  const auth = useAuth();
  const [showDataInfo, setShowDataInfo] = useState(false);
  const user = auth.isSignedIn ? auth.session?.user : null;
  const name = String(user?.user_metadata.full_name || t("Tài khoản của bạn"));
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('vi') || 'VS';
  function signOut() {
    Alert.alert(t("Đăng xuất tài khoản?"), t("Hồ sơ, lịch sử, ghi chú và logo vẫn được giữ trên thiết bị. Đăng nhập lại để tiếp tục sử dụng."), [
      { text: t("Ở lại"), style: 'cancel' }, { text: t("Đăng xuất"), onPress: () => { void auth.signOut(); } },
    ]);
  }
  return <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heading}><Text accessibilityRole="header" style={styles.pageTitle}>{t("Cài đặt")}</Text><Text style={styles.subtitle}>{t("Quản lý tài khoản và tìm trợ giúp.")}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={user ? t("Mở thông tin tài khoản") : t("Đăng nhập hoặc đăng ký")}
        onPress={() => router.push(user ? '/profile' : '/login')} style={({ pressed }) => [styles.account, pressed && styles.pressed]}>
        <View style={styles.avatar}><Text accessible={false} style={styles.initials}>{user ? initials : 'VS'}</Text></View>
        <View style={styles.accountText}><Text style={styles.name}>{user ? name : t("Bạn đang xem trước")}</Text><Text style={styles.email}>{user?.email || t("Đăng nhập để lưu hồ sơ và lịch sử")}</Text><Text style={styles.accountLink}>{user ? t("Thông tin tài khoản") : t("Đăng nhập / Đăng ký")}</Text></View>
        <Text accessible={false} style={styles.arrow}>›</Text>
      </Pressable>
      <LanguageSettings />
      <SettingsGroup title={t("Hỗ trợ và trải nghiệm")}>
        <SettingsRow title={t("Hướng dẫn sử dụng")} subtitle={t("Từ chuẩn bị bài đến xuất báo cáo")} onPress={() => router.push('/guide')} />
        <SettingsRow title={t("Báo lỗi và góp ý")} subtitle={t("Soạn phản hồi, xem lại rồi chia sẻ")} onPress={() => router.push('/feedback')} />
        <SettingsRow title={t("Thử demo")} subtitle={t("Hồ sơ mẫu · Không lưu vào tài khoản")} onPress={() => router.push('/demo')} />
      </SettingsGroup>
      <View style={styles.dataSection}>
        <SettingsGroup title={t("Dữ liệu trên thiết bị")}>
          {user ? <SettingsRow title={t('Nhật ký hoạt động')} subtitle={t('Xem thao tác hồ sơ, lượt kiểm tra và báo cáo')} onPress={() => router.push('/activity')} /> : null}
          {user ? <SettingsRow title={t("Thùng rác")} subtitle={t("Khôi phục hồ sơ trong 30 ngày")} onPress={() => router.push('/patients/trash')} /> : null}
          <View>
            <SettingsRow title={t("Cách lưu và bảo vệ dữ liệu")} subtitle={showDataInfo ? t("Chạm để thu gọn") : t("Chạm để xem thông tin")} expanded={showDataInfo} onPress={() => setShowDataInfo((value) => !value)} />
            {showDataInfo ? <View style={styles.details}>
              <Text style={styles.detailText}>{t("Hồ sơ, lượt chạy, ghi chú và logo được lưu riêng theo tài khoản trên thiết bị; chưa đồng bộ đám mây hoặc mã hóa.")}</Text>
              <Text style={styles.detailText}>{t("Thùng rác giữ hồ sơ và phiên liên quan trong 30 ngày. Xóa vĩnh viễn hoặc hết hạn sẽ xóa hẳn các dữ liệu đó.")}</Text>
              <Text style={styles.detailText}>{t("Camera là tùy chọn, không thu âm. Video tạm được xóa khi dừng đoạn quay. Demo dùng dữ liệu riêng trong bộ nhớ.")}</Text>
            </View> : null}
          </View>
        </SettingsGroup>
        <Text style={styles.smallNote}>{t("Chỉ dùng dữ liệu giả lập. Chưa đồng bộ đám mây.")}</Text>
      </View>
      {user ? <SettingsGroup title={t("Đăng xuất")}>
        <SettingsRow title={t("Đăng xuất")} subtitle={t("Giữ hồ sơ, lịch sử và logo trên thiết bị")} disabled={auth.endingSession} onPress={signOut} />
        {Platform.OS !== 'web' ? <LocalDataRemoval key={user.id} ownerId={user.id} /> : null}
      </SettingsGroup> : <SettingsGroup title={t("Tài khoản")}><SettingsRow title={t("Về màn hình đăng nhập")} subtitle={t("Đăng nhập hoặc tạo tài khoản mới")} onPress={() => { auth.exitPreview(); router.replace('/login'); }} /></SettingsGroup>}
      <View style={styles.footer}><Text style={styles.footerBrand}>VestibularScreening · 1.0.0</Text><Text style={styles.footerText}>{t("Tiếng Việt · Nguyên mẫu học tập")}</Text><Text style={styles.footerText}>{t("Không dùng để chẩn đoán.")}</Text></View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 24, width: '100%', maxWidth: 600, alignSelf: 'center' },
  heading: { gap: 6 }, pageTitle: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: '700' }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  account: { padding: 18, borderWidth: 1, borderColor: '#DCE4EB', borderRadius: 20, backgroundColor: colors.surface, flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tint, justifyContent: 'center', alignItems: 'center' }, initials: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  accountText: { flex: 1, gap: 4 }, name: { color: colors.text, fontSize: 17, lineHeight: 25, fontWeight: '700' }, email: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  accountLink: { color: colors.primary, fontSize: 13, lineHeight: 20, fontWeight: '600', marginTop: 3 }, arrow: { color: '#52667A', fontSize: 25 }, pressed: { backgroundColor: colors.tint },
  dataSection: { gap: 9 }, details: { paddingHorizontal: 17, paddingBottom: 17, gap: 12 }, detailText: { color: colors.muted, fontSize: 14, lineHeight: 22 }, smallNote: { color: colors.muted, fontSize: 12, lineHeight: 19, paddingHorizontal: 4 },
  footer: { gap: 4, alignItems: 'center', paddingTop: 2 }, footerBrand: { color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '600' }, footerText: { color: colors.muted, fontSize: 12, lineHeight: 19 },
});
