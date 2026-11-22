import { useLanguage } from '../../features/language/LanguageProvider';
import PatientFormScreen from '../../features/patients/PatientFormScreen';

export default function EditPatientRoute() {
  useLanguage();
  return <PatientFormScreen />;
}
