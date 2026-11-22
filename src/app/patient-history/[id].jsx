import { useLanguage } from '../../features/language/LanguageProvider';
import { useLocalSearchParams } from 'expo-router';
import { SessionHistoryScreen } from '../../features/tests/SessionHistoryScreen';
export default function PatientHistoryRoute() {
  useLanguage();
  const { id } = useLocalSearchParams();
  return <SessionHistoryScreen patientId={typeof id === 'string' ? id : 'invalid'} />;
}
