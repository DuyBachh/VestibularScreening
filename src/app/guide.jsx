import { t } from '../features/language/language.js';
import { useLanguage } from '../features/language/LanguageProvider';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { LearningFold, LearningScreen, learningStyles } from '../features/guide/LearningUI';
import { getGuideCategories } from '../features/guide/guideTopics';
import { colors } from '../constants/theme';

export default function GuideScreen() {
  useLanguage();
  const guideCategories = getGuideCategories();
  const [categoryId, setCategoryId] = useState('start');
  const [openId, setOpenId] = useState('');
  const category = guideCategories.find((item) => item.id === categoryId) || guideCategories[0];
  return <LearningScreen title={t("Bạn cần tìm hiểu gì?")} subtitle={t("Chọn một nhóm, rồi mở đúng mục bạn cần.")}>
    <View style={styles.welcome}><Text style={styles.welcomeTitle}>{t("Lần đầu dùng ứng dụng?")}</Text><Text style={learningStyles.body}>{t("Thử sáu bài với hồ sơ mẫu, không cần camera hay tài khoản.")}</Text><Button onPress={() => router.push('/demo')}>{t("Bắt đầu với Demo")}</Button></View>
    <View style={styles.categories}>{guideCategories.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: item.id === categoryId }}
      onPress={() => { setCategoryId(item.id); setOpenId(''); }} style={({ pressed }) => [styles.category, item.id === categoryId && styles.selected, pressed && { opacity: 0.75 }]}>
      <Text style={[styles.categoryText, item.id === categoryId && styles.selectedText]}>{item.label}</Text>
    </Pressable>)}</View>
    <View style={styles.heading}><Text accessibilityRole="header" style={learningStyles.section}>{category.label}</Text><Text style={learningStyles.body}>{category.description}</Text></View>
    <View style={styles.topics}>{category.topics.map((topic) => <LearningFold key={topic.id} title={topic.title} summary={topic.summary} expanded={openId === topic.id} onPress={() => setOpenId((previous) => previous === topic.id ? '' : topic.id)}>
      {topic.paragraphs.map((paragraph) => <Text key={paragraph} style={learningStyles.body}>{paragraph}</Text>)}
      {topic.action ? <Button onPress={() => { if (topic.action) router.push(topic.action.href); }}>{topic.action.label}</Button> : null}
    </LearningFold>)}</View>
    <Button secondary onPress={() => router.replace('/')}>{t("Về trang chủ")}</Button>
  </LearningScreen>;
}
const styles = StyleSheet.create({
  welcome: { padding: 18, gap: 12, backgroundColor: colors.tint, borderRadius: 18 }, welcomeTitle: { color: colors.primary, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, category: { flexBasis: '45%', flexGrow: 1, padding: 12, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: '#DCE4EB', backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary }, categoryText: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' }, selectedText: { color: '#FFFFFF' },
  heading: { gap: 5 }, topics: { gap: 10 },
});
