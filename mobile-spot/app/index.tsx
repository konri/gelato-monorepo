import { useSession } from '@/contexts/SessionProvider';
import { useSpotState } from '@/hooks/useActiveSpot';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

// Entry gate: spinner while the session / spot context load, then the login
// screen, the choose-spot screen (several spots, no fresh choice, or none),
// or the tabs.
export default function Index() {
  const session = useSession();
  const spot = useSpotState();

  if (session.status === 'loading' || (session.status === 'signedIn' && (spot.status === 'idle' || spot.status === 'loading'))) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  if (session.status === 'signedOut' || spot.status === 'signedOut') {
    return <Redirect href="/login" />;
  }

  if (spot.status !== 'ready') {
    return <Redirect href="/choose-spot" />;
  }

  return <Redirect href="/(tabs)" />;
}
