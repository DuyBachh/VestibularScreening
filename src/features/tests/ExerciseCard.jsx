import { t } from '../language/language.js';
import { useLanguage } from '../language/LanguageProvider';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { testPresentation } from './testPresentation';

/** @param {{test: {id: string, name: string}, onSelect: () => void}} props */
export function ExerciseCard({ test, onSelect }) {
  useLanguage();
  return <View style={styles.card}>
    <View style={styles.meta}>
      <View style={styles.mark} accessible={false}>
        {test.id === 'smooth-pursuit' || test.id === 'gaze-evoked' ? <View style={styles.eye}><View style={styles.pupil} /></View> : <Text style={styles.horizontal}>{test.id === 'okn' ? '▥' : test.id === 'vertical-saccades' ? '↕' : test.id === 'anti-saccade' ? '⇄' : '↔'}</Text>}
      </View>
      <Text style={styles.duration}>{t("30 giây thực hiện")}</Text>
    </View>
    <View style={styles.names}>
      <Text accessibilityRole="header" style={styles.title}>{test.name}</Text>
      <Text style={styles.translation}>{testPresentation(test.id).title}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={t("Chọn bài {0}", [test.name])} onPress={onSelect}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{t("Chọn bài")}</Text><Text accessible={false} style={styles.arrow}>→</Text>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  card: { width: '100%', padding: 20, gap: 17, borderRadius: 20, borderWidth: 1, borderColor: '#D7E4E9', backgroundColor: '#FFFFFF', shadowColor: '#132F42', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10 }, mark: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E9F3F5', alignItems: 'center', justifyContent: 'center' },
  eye: { width: 19, height: 13, borderRadius: 8, borderWidth: 1.5, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' }, pupil: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary }, horizontal: { color: colors.primary, fontSize: 23, lineHeight: 28 },
  duration: { color: colors.primary, fontSize: 12, lineHeight: 19, fontWeight: '600', flex: 1 }, names: { gap: 6 }, title: { color: colors.text, fontSize: 22, lineHeight: 30, fontWeight: '700' }, translation: { color: '#52667A', fontSize: 15, lineHeight: 23 },
  button: { minHeight: 50, paddingHorizontal: 16, paddingVertical: 13, gap: 10, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, pressed: { backgroundColor: '#0D3B4D' }, buttonText: { color: '#FFFFFF', fontSize: 16, lineHeight: 24, fontWeight: '700' }, arrow: { color: '#FFFFFF', fontSize: 18, lineHeight: 24 },
});
