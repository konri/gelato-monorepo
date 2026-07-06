import { loginWithGoogleMobile } from '@/shared/api-client';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { useUserSync } from './useUserSync';

let GoogleSignin: any;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  GoogleSignin = null;
}

export const useGoogleSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { handlePostLogin } = useUserSync();

  const signIn = async () => {
    try {
      setIsLoading(true);

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo || !userInfo.data) {
        return null;
      }
      
      if (!userInfo.data?.serverAuthCode) {
        throw new Error('No server auth code received from Google');
      }

      const response = await loginWithGoogleMobile(userInfo.data.serverAuthCode);
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      await handlePostLogin(response.data.user, response.data.token.access_token, 'google', response.data.refreshToken);
      
      // Ustaw flagę pierwszego logowania dla third party
      if (response.data.isFirstTimeGoogleLogin) {
        await AsyncStorage.setItem('isFirstTimeLogin', 'true');
      }
      
      return response.data;
    } catch (error: any) {
      logger.error('Google Sign-In error:', error);

      if (error?.code === 'SIGN_IN_CANCELLED' || 
          error?.message?.includes('cancelled') ||
          error?.message?.includes('canceled')) {
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
  };
};