import { useLanguage } from '../../features/language/LanguageProvider';
import { SessionHistoryScreen } from '../../features/tests/SessionHistoryScreen';
export default function HistoryScreen() {
  useLanguage();
  return <SessionHistoryScreen />;
}
