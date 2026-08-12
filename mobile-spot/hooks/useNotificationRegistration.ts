import { executeGraphQLQuery } from '@/shared/api-client/src/graphql/client';
import { REGISTER_DEVICE } from '@/shared/api-client/src/graphql/mutations/notifications/registerDevice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const useNotificationRegistration = () => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // @react-native-firebase/messaging is native-only — there's no Firebase
    // app instance on web, so calling messaging() there throws uncaught and
    // crashes the tree. Push registration isn't implemented for web yet.
    if (Platform.OS === 'web') return;

    // Lazy-required so the native module is never touched on web at all.
    const NotificationService = require('@/services/notificationService').default;

    // Send an FCM token to the backend (skips silently if not logged in).
    const registerToken = async (fcmToken: string) => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        logger.warn('⚠️ No auth token found, skipping notification registration');
        return;
      }
      const deviceInfo = await NotificationService.getDeviceInfo();
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
    };

    const registerDevice = async () => {
      try {
        logger.log('🔔 Starting notification registration...');
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          logger.warn('⚠️ No auth token found, skipping notification registration');
          return;
        }

        const fcmToken = await NotificationService.getFCMToken();
        if (!fcmToken) {
          logger.warn('Could not get FCM token');
          return;
        }

        logger.log('🚀 Sending registration to backend...');
        await registerToken(fcmToken);
      } catch (error) {
        logger.error('❌ Error registering device:', error);
      }
    };

    registerDevice();

    // Re-register whenever Firebase rotates the token.
    const unsubscribe = NotificationService.onTokenRefresh((newToken: string) => {
      logger.log('🔄 FCM token refreshed, re-registering');
      void registerToken(newToken).catch((e) => logger.error('Token refresh register failed:', e));
    });
    return unsubscribe;
  }, []);

  // NOTE: notification receive/tap listeners are registered by
  // <NotificationBridge> (mounted under ToastProvider) so they can show a toast
  // and navigate. Don't register them here too, or handlers fire twice.

  return { isRegistered };
};
