import { useAuthState } from '@/hooks/useAuthState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoggedIn, isLoading } = useAuthState();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((v) => setHasSeenOnboarding(!!v));
  }, []);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
}
