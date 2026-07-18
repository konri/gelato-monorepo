import { useAuthState } from '@/hooks/useAuthState';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoggedIn, isLoading } = useAuthState();
  // Only meaningful once logged in; couriers must have a selfie on file.
  const { data: me, loading: meLoading } = useWhoAmI();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isLoggedIn) {
    // Wait for the profile check before deciding, to avoid a flash of tabs.
    if (meLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    // A courier with no profile photo must take a selfie first.
    if (me && !me.profilePicture) {
      return <Redirect href={'/selfie' as any} />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
