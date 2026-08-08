import { loginWithAppleMobile } from '@/shared/api-client';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Platform } from 'react-native';
import { useUserSync } from './useUserSync';

// Required by lazy-require: the module is native-only, so importing it eagerly
// crashes Expo Go / web where the native part is absent (same guard as
// useGoogleSignIn).
let AppleAuthentication: any;
try {
  AppleAuthentication = require('expo-apple-authentication');
} catch (e) {
  AppleAuthentication = null;
}

export const useAppleSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { handlePostLogin } = useUserSync();

  /** Apple Sign-In is iOS-only; hide the button elsewhere. */
  const isAvailable = Platform.OS === 'ios' && !!AppleAuthentication;

  const signIn = async () => {
    try {
      setIsLoading(true);

      if (!AppleAuthentication) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential?.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // fullName/email are only populated on the very first authorisation —
      // forward them so the backend can persist them before they are gone.
      const response = await loginWithAppleMobile(credential.identityToken, {
        email: credential.email,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName,
              familyName: credential.fullName.familyName,
            }
          : null,
      });

      if (response.error || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      await handlePostLogin(
        response.data.user,
        response.data.token.access_token,
        'apple',
        response.data.refreshToken,
      );

      if (response.data.isFirstTimeAppleLogin) {
        await AsyncStorage.setItem('isFirstTimeLogin', 'true');
      }

      return response.data;
    } catch (error: any) {
      logger.error('Apple Sign-In error:', error);

      // The user dismissing the sheet is not an error worth surfacing.
      if (
        error?.code === 'ERR_REQUEST_CANCELED' ||
        error?.code === 'ERR_CANCELED' ||
        error?.message?.includes('canceled') ||
        error?.message?.includes('cancelled')
      ) {
        return null;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isLoading,
    isAvailable,
  };
};
