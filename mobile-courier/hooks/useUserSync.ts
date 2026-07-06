import { getWhoAmI } from '@/shared/api-client/src/graphql/queries/user/getWhoAmI';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthState } from './useAuthState';

export const useUserSync = () => {
  const { updateAuthState } = useAuthState();

  const syncUserData = async (loginMethod: 'email' | 'google' | 'phone' = 'email') => {
    try {
      const result = await getWhoAmI();
      
      if (result.success && result.data) {
        await AsyncStorage.multiSet([
          ['locationPermissionGranted', result.data.locationPermission ? 'true' : 'false'],
          ['userData', JSON.stringify(result.data)]
        ]);
        
        return result.data;
      }
      return null;
    } catch (error) {
      logger.error(`Error syncing user data for ${loginMethod} login:`, error);
      return null;
    }
  };

  const handlePostLogin = async (user: any, token: string, loginMethod: 'email' | 'google' | 'phone' = 'email', refreshToken?: string) => {
    await updateAuthState(user, token, refreshToken);
    
    // For phone auth, we already have all user data from the response
    // Skip syncUserData to avoid "Access denied" error with fresh token
    if (loginMethod !== 'phone') {
      await syncUserData(loginMethod);
    } else {
      // Just save location permission for phone users
      await AsyncStorage.setItem('locationPermissionGranted', 'false');
    }
  };

  return {
    syncUserData,
    handlePostLogin
  };
};