import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { SettingsRow } from '../settings/SettingsUI';

/** @param {{title: string, subtitle: string, children: import('react').ReactNode}} props */
export function LearningScreen({ title, subtitle, children }) {
  useLanguage();
  return <SafeAreaView style={learningStyles.safe} edges={['left', 'right', 'bottom']}>
    <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={learningStyles.content}>
      <View style={learningStyles.heading}><Text accessibilityRole="header" style={learningStyles.title}>{title}</Text><Text style={learningStyles.body}>{subtitle}</Text></View>
      {children}
      <Text style={learningStyles.footer}>{t("Nguyên mẫu học tập · Không dùng để chẩn đoán.")}</Text>
    </ScrollView>
  </SafeAreaView>;
}
/** @param {{title: string, summary: string, expanded: boolean, onPress: () => void, children: import('react').ReactNode}} props */
export function LearningFold({ title, summary, expanded, onPress, children }) {
  useLanguage();
  return <View style={learningStyles.fold}>
    <SettingsRow title={title} subtitle={summary} expanded={expanded} onPress={onPress} />
    {expanded ? <View style={learningStyles.foldBody}>{children}</View> : null}
  </View>;
}
export const learningStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, gap: 20, width: '100%', maxWidth: 600, alignSelf: 'center' },
  heading: { gap: 7 }, title: { color: colors.text, fontSize: 29, lineHeight: 37, fontWeight: '700' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  section: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '700' }, card: { padding: 18, gap: 14, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#DCE4EB' },
  fold: { borderRadius: 18, borderWidth: 1, borderColor: '#DCE4EB', backgroundColor: colors.surface, overflow: 'hidden' }, foldBody: { paddingHorizontal: 17, paddingBottom: 18, gap: 14 },
  footer: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center' },
});
