import { t } from '../../features/language/language.js';
import { useLanguage } from '../../features/language/LanguageProvider';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { LearningScreen, learningStyles } from '../../features/guide/LearningUI';
import { testCatalog, isSupportedTest } from '../../features/tests/catalog';
import { StimulusPlayer } from '../../features/tests/StimulusPlayer';
import { testPresentation } from '../../features/tests/testPresentation';
export default function TestDetailScreen() {
  useLanguage();
  const { id } = useLocalSearchParams();
  const test = testCatalog.find((item) => item.id === id);
  const supported = test && isSupportedTest(test.id);
  return <LearningScreen title={test?.name || t("Không tìm thấy bài kiểm tra")} subtitle={supported ? testPresentation(test.id).title : t("Quay lại danh sách để chọn bài có thể chạy.")}>
    {test && isSupportedTest(test.id) ? <>
      <StimulusPlayer key={test.id} id={test.id} />
    </> : <Text style={learningStyles.body}>{test ? t("Bài này đang được phát triển, chưa thể chạy.") : t("Không tìm thấy bài kiểm tra này.")}</Text>}
  </LearningScreen>;
}
