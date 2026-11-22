import { useAuth } from '../features/auth/AuthProvider';
import { PendingRunsScreen } from '../features/tests/PendingRunsScreen';
export default function DraftsRoute() {
  const auth = useAuth();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  return owner ? <PendingRunsScreen key={owner} ownerId={owner} /> : null;
}
