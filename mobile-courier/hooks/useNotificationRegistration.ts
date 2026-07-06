import NotificationService from '@/services/notificationService';
import { executeGraphQLQuery } from '@/shared/api-client/src/graphql/client';
import { REGISTER_DEVICE } from '@/shared/api-client/src/graphql/mutations/notifications/registerDevice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const useNotificationRegistration = () => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const registerDevice = async () => {
      try {
        logger.log('🔔 Starting notification registration...');
        const token = await AsyncStorage.getItem('access_token');
        
        if (!token) {
          logger.warn('⚠️ No auth token found, skipping notification registration');
          return;
        }
        
        logger.log('✅ Auth token found, proceeding with registration');

        const fcmToken = await NotificationService.getFCMToken();
        if (!fcmToken) {
          logger.warn('Could not get FCM token');
          return;
        }

        const deviceInfo = await NotificationService.getDeviceInfo();
        logger.log('📱 Device info:', deviceInfo);

        logger.log('🚀 Sending registration to backend...');
        const result = await executeGraphQLQuery(REGISTER_DEVICE, {
          variables: {
            token: fcmToken,
            platform: deviceInfo.platform,
            deviceId: deviceInfo.deviceId,
          },
          token,
        });

        if (result.success) {
          logger.log('✅ Push notifications registered successfully');
          setIsRegistered(true);
        } else {
          logger.error('❌ Failed to register device:', result.error);
        }
      } catch (error) {
        logger.error('❌ Error registering device:', error);
      }
    };

    registerDevice();
  }, []);

  // Setup notification listeners
  useEffect(() => {
    const cleanup = NotificationService.setupNotificationListeners();
    return cleanup;
  }, []);

  return { isRegistered };
};
