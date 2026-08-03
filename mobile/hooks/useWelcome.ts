import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppleSignIn } from '@/hooks/useAppleSignIn';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';

export const useWelcome = () => {
  const { t } = useTranslation();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleSignIn();
  const {
    signIn: appleSignIn,
    isLoading: isAppleLoading,
    isAvailable: isAppleAvailable,
  } = useAppleSignIn();

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
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      Alert.alert(t('Common.error'), error instanceof Error ? error.message : t('Common.googleLoginFailed'));
    }
  };

  const handleAppleLogin = async () => {
    try {
      const result = await appleSignIn();
      if (result) {
        if (result.isFirstTimeAppleLogin) {
          router.replace('/signup-details');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      Alert.alert(t('Common.error'), error instanceof Error ? error.message : t('Common.appleLoginFailed'));
    }
  };

  return {
    isGoogleLoading,
    isAppleLoading,
    isAppleAvailable,
    handleSignUp,
    handleSignIn,
    handleGoogleLogin,
    handleAppleLogin,
  };
};
