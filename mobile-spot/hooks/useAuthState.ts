import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  surname?: string;
  roles?: string[];
  profileType?: string;
  city?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    token: null,
    isLoading: true,
  });

  const loadAuthState = async () => {
    try {
      const [isLoggedIn, userData, token] = await AsyncStorage.multiGet([
        'isLoggedIn',
        'userData', 
        'access_token'
      ]);

      const loggedIn = isLoggedIn[1] === 'true';
      const user = userData[1] ? JSON.parse(userData[1]) : null;
      const accessToken = token[1];

      setAuthState({
        isLoggedIn: loggedIn,
        user,
        token: accessToken,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Error loading auth state:', error);
      setAuthState({
        isLoggedIn: false,
        user: null,
        token: null,
        isLoading: false,
      });
    }
  };

  const updateAuthState = async (user: User, token: string, refreshToken?: string) => {
    try {
      const dataToSet: [string, string][] = [
        ['isLoggedIn', 'true'],
        ['userData', JSON.stringify(user)],
        ['access_token', token],
      ];

      if (refreshToken) {
        dataToSet.push(['refresh_token', refreshToken]);
      }

      // Only set userEmail if it exists and is not a phone email
      if (user.email && !user.email.includes('@phone.easybons')) {
        dataToSet.push(['userEmail', user.email]);
      }

      await AsyncStorage.multiSet(dataToSet);

      setAuthState({
        isLoggedIn: true,
        user,
        token,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Error updating auth state:', error);
    }
  };

  const clearAuthState = async () => {
    try {
      await AsyncStorage.multiRemove([
        'isLoggedIn',
        'userData',
        'access_token',
        'refresh_token',
        'userEmail',
        'isFirstTimeLogin',
        'pendingPhoneNumber',
        'pendingVerificationEmail',
        'pendingPasswordResetEmail',
      ]);

      setAuthState({
        isLoggedIn: false,
        user: null,
        token: null,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Error clearing auth state:', error);
    }
  };

  useEffect(() => {
    loadAuthState();
  }, []);

  return {
    ...authState,
    updateAuthState,
    clearAuthState,
    refreshAuthState: loadAuthState,
  };
};