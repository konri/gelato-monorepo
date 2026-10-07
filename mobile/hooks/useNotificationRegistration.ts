import NotificationService from '@/services/notificationService';
import { appVersion, CLIENT_APP } from '@/shared/api-client/src/clientInfo';
import { executeGraphQLQuery } from '@/shared/api-client/src/graphql/client';
import {
  REGISTER_DEVICE,
  REMOVE_DEVICE,
} from '@/shared/api-client/src/graphql/mutations/notifications/registerDevice';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const UNREGISTER_TIMEOUT_MS = 3000;

/**
 * Logout: stop this device's pushes for the user who is leaving, BEFORE the
 * tokens are cleared (the call needs them). Best effort and bounded: offline
 * or a slow server never blocks the logout. No token refresh here (a late
 * refresh would write the leaving user's token back after the logout); with an
 * expired token the row stays until this device registers for the next user,
 * which deactivates it on the server.
 */
export async function unregisterPushDevice(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return;
    const deviceId = await NotificationService.getDeviceId();
    const call = executeGraphQLQuery(REMOVE_DEVICE, {
      variables: { deviceId },
      token,
      silent: true,
      noAuthRecovery: true,
    });
    await Promise.race([
      call,
      new Promise((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT_MS)),
    ]);
  } catch (error) {
    logger.warn('Push unregister on logout failed', error);
  }
}

export const useNotificationRegistration = () => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
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
          clientApp: CLIENT_APP,
          appVersion: appVersion(),
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
    const unsubscribe = NotificationService.onTokenRefresh((newToken) => {
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
