import { useAuthState } from '@/hooks/useAuthState';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoggedIn, isLoading } = useAuthState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  // Only fetch the profile once we're sure the user is logged in (and the
  // token has been read). Firing `me` before that would look like an expired
  // session and log the user out.
  const { data: me, loading: meLoading } = useWhoAmI(isReady && isLoggedIn);

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
    // A courier with a loaded profile must finish onboarding first: name +
    // surname, a verified phone (skipped for phone signups), and a photo. If
    // the profile failed to load (me is null), fall through to tabs rather than
    // blocking — the gate is a nudge, not a hard wall.
    if (me && (!me.firstName || !me.surname || !me.phoneVerified || !me.profilePicture)) {
      return <Redirect href={'/selfie' as any} />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
