import { useLanguage } from '../../features/language/LanguageProvider';
import PatientsListScreen from '../../features/patients/PatientsListScreen';

export default function PatientsRoute() {
  useLanguage();
  return <PatientsListScreen />;
}
