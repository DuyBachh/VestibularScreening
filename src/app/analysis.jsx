import { AnalysisScreen } from '../features/analysis/AnalysisScreen';
import { useAuth } from '../features/auth/AuthProvider';
export default function AnalysisRoute() {
  const auth = useAuth();
  return <AnalysisScreen key={auth.isSignedIn ? auth.session?.user.id : 'preview'} />;
}
