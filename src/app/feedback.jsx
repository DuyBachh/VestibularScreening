import { useLanguage } from '../features/language/LanguageProvider';
import { FeedbackForm } from '../features/support/FeedbackForm';
import { useAuth } from '../features/auth/AuthProvider';
export default function FeedbackScreen() {
  useLanguage();
  const auth = useAuth();
  return <FeedbackForm key={auth.isSignedIn ? auth.session?.user.id : 'preview'} />;
}
