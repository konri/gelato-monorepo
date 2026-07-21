import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';

export const useWelcome = () => {
  const { t } = useTranslation();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleSignIn();

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        if (result.isFirstTimeGoogleLogin) {
          router.replace('/signup-details');
        } else {
          // Route through the root gate (app/index.tsx) so couriers with an
          // incomplete profile finish onboarding before reaching the tabs.
          router.replace('/');
        }
      }
    } catch (error) {
      Alert.alert(t('Common.error'), error instanceof Error ? error.message : t('Common.googleLoginFailed'));
    }
  };

  const handleAppleLogin = async () => {
    Alert.alert(t('Common.error'), t('Common.appleNotImplemented'));
  };

  return {
    isGoogleLoading,
    handleSignUp,
    handleSignIn,
    handleGoogleLogin,
    handleAppleLogin,
  };
};
