import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../features/auth/AuthProvider';
import { BatteryResultsScreen } from '../../features/tests/BatteryHistoryScreen';
export default function BatteryResultsRoute() {
  const auth = useAuth();
  const { id } = useLocalSearchParams();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  return owner && typeof id === 'string' ? <BatteryResultsScreen key={`${owner}:${id}`} ownerId={owner} id={id} /> : null;
}
