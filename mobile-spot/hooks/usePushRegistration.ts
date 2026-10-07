import { useSession } from '@/contexts/SessionProvider';
import { APP_VERSION, CLIENT_APP } from '@/shared/api-client/src/clientInfo';
import { executeGraphQLQuery } from '@/shared/api-client/src/graphql/client';
import { REGISTER_DEVICE } from '@/shared/api-client/src/graphql/mutations/notifications/registerDevice';
import { spotStore } from '@/stores/spotStore';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useSpotState } from './useActiveSpot';

/**
 * Registers this device for staff pushes (BRANDS_SPEC §4.6) once the spot
 * context is ready, and again whenever Firebase rotates the token:
 * `registerFCMToken(token, platform, deviceId = install id, clientApp 'spot',
 * appVersion, activeSpotId)`. Spot switches move the device's routing through
 * `selectActiveSpot` (spotStore); sign-out removes the token.
 *
 * Mounted by StaffTabsGate (both tab layouts, so iOS registers too).
 */
export const usePushRegistration = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const session = useSession();
  const spot = useSpotState();
  const userId = session.status === 'signedIn' ? session.userId ?? 'signed-in' : null;
  const ready = spot.status === 'ready' && !!spot.activeSpotId;
  // Register once per signed-in user (the active spot at that moment).
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      registeredFor.current = null;
      setIsRegistered(false);
    }
  }, [userId]);

  useEffect(() => {
    // @react-native-firebase/messaging is native-only — there's no Firebase
    // app instance on web, so calling messaging() there throws uncaught and
    // crashes the tree. Push registration isn't implemented for web yet.
    if (Platform.OS === 'web') return;
    if (!userId || !ready) return;

    // Lazy-required so the native module is never touched on web at all.
    const NotificationService = require('@/services/notificationService').default;
    let cancelled = false;

    const registerToken = async (fcmToken: string): Promise<boolean> => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        logger.warn('⚠️ No auth token found, skipping notification registration');
        return false;
      }
      const deviceInfo = await NotificationService.getDeviceInfo();
      const result = await executeGraphQLQuery(REGISTER_DEVICE, {
        variables: {
          token: fcmToken,
          platform: deviceInfo.platform,
          deviceId: deviceInfo.deviceId,
          clientApp: CLIENT_APP,
          appVersion: APP_VERSION,
          activeSpotId: spotStore.getActiveSpotId(),
        },
        token,
      });
      if (result.success) {
        logger.log('✅ Push notifications registered successfully');
        if (!cancelled) setIsRegistered(true);
        return true;
      }
      logger.error('❌ Failed to register device:', result.error);
      return false;
    };

    if (registeredFor.current !== userId) {
      registeredFor.current = userId;
      void (async () => {
        try {
          logger.log('🔔 Starting notification registration...');
          const fcmToken = await NotificationService.getFCMToken();
          if (!fcmToken) {
            logger.warn('Could not get FCM token');
            registeredFor.current = null;
            return;
          }
          // Finish even if the effect re-ran meanwhile: it registers once per user.
          if (!(await registerToken(fcmToken))) registeredFor.current = null;
        } catch (error) {
          logger.error('❌ Error registering device:', error);
          registeredFor.current = null;
        }
      })();
    }

    // Re-register whenever Firebase rotates the token.
    const unsubscribe = NotificationService.onTokenRefresh((newToken: string) => {
      logger.log('🔄 FCM token refreshed, re-registering');
      void registerToken(newToken).catch((e) => logger.error('Token refresh register failed:', e));
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [userId, ready]);

  // NOTE: notification receive/tap listeners are registered by
  // <NotificationBridge> (mounted under ToastProvider) so they can show a toast
  // and navigate. Don't register them here too, or handlers fire twice.

  return { isRegistered };
};
