import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../features/auth/AuthProvider';
import { BatteryHistoryScreen } from '../features/tests/BatteryHistoryScreen';
export default function BatteryHistoryRoute() {
  const auth = useAuth();
  const { patientId } = useLocalSearchParams();
  const owner = auth.isSignedIn ? auth.session?.user.id : undefined;
  const patient = typeof patientId === 'string' ? patientId : '';
  return owner ? <BatteryHistoryScreen key={`${owner}:${patient}`} ownerId={owner} patientId={patient} /> : null;
}
