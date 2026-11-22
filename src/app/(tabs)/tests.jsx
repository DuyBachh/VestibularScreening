import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { Button } from '../../components/Button';
import { testCatalog, supportedTests } from '../../features/tests/catalog';
import { ExerciseCard } from '../../features/tests/ExerciseCard';
import { LearningScreen, learningStyles } from '../../features/guide/LearningUI';

export default function TestsScreen() {
  useLanguage();
  const [showUpcoming, setShowUpcoming] = useState(false);
  return <LearningScreen title={t("Chọn bài kiểm tra")} subtitle={t("Chọn một bài bên dưới để bắt đầu.")}>
    <View style={styles.upcoming}><Text style={styles.upcomingTitle}>{t("Chạy chuỗi 6 bài")}</Text><Text style={learningStyles.body}>{t("Chọn hồ sơ và camera một lần, nghỉ giữa các bài, lưu từng lượt riêng.")}</Text><Button onPress={() => router.push('/battery')}>{t("Chuẩn bị chuỗi")}</Button></View>
    <View style={styles.list}>{supportedTests.map((test) => <ExerciseCard key={test.id} test={test}
      onSelect={() => router.push({ pathname: '/tests/[id]', params: { id: test.id } })} />)}</View>
    <View style={styles.secondary}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/demo')} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={styles.linkText}>{t("Thử Demo trước")}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showUpcoming }} onPress={() => setShowUpcoming((value) => !value)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={styles.linkText}>{showUpcoming ? t("Thu gọn bài đang phát triển") : t("Bài đang phát triển")}</Text></Pressable>
    </View>
    {showUpcoming ? <View style={styles.upcoming}>
      <Text style={styles.upcomingTitle}>{t("Các bài đang phát triển")}</Text>
      <Text style={learningStyles.body}>{t("Chưa thể chạy trong phiên bản này.")}</Text>
      {testCatalog.filter((test) => !supportedTests.some((item) => item.id === test.id)).map((test) => <Text key={test.id} style={styles.upcomingName}>{test.name}</Text>)}
      <Text style={styles.upcomingName}>Near Point of Convergence</Text>
    </View> : null}
  </LearningScreen>;
}
const styles = StyleSheet.create({
  list: { gap: 16, marginTop: 2 }, secondary: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 16, rowGap: 2 },
  link: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 2, justifyContent: 'center', borderRadius: 6 }, linkText: { color: colors.muted, fontSize: 13, lineHeight: 21, fontWeight: '500' }, pressed: { opacity: 0.65 },
  upcoming: { padding: 17, gap: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#DCE4EB' }, upcomingTitle: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '600' }, upcomingName: { color: colors.muted, fontSize: 14, lineHeight: 22 },
});
