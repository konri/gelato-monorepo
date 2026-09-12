import { logger } from '@/utils/logger';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

// Foreground: we render our own toast in NotificationBridge. Showing the OS
// banner as well stacked two alerts on top of each other and looked like a blink.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

function flattenFcmData(data: unknown): Record<string, string | undefined> {
  if (!data || typeof data !== 'object') return {};
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value == null) out[key] = undefined;
    else if (typeof value === 'string') out[key] = value;
    else out[key] = String(value);
  }
  return out;
}

export class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    // Ask via Firebase Messaging so iOS registers the app with APNs/FCM.
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      logger.warn('Failed to get push notification permissions');
      return false;
    }

    return true;
  }

  async getFCMToken(): Promise<string | null> {
    if (this.fcmToken) {
      return this.fcmToken;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // On iOS the device must be registered for remote messages before the FCM
      // token can be minted; without this getToken() throws messaging/unregistered.
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
        // Give APNs a beat to hand back the token to Firebase.
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Fetch the real FCM registration token (firebase-admin can route to this,
      // unlike the raw APNs token expo-notifications returns on iOS). Retry a few
      // times because iOS can briefly report messaging/unregistered on first run.
      let token: string | null = null;
      for (let attempt = 0; attempt < 3 && !token; attempt++) {
        try {
          token = await messaging().getToken();
          if (token) break;
        } catch (tokenError: any) {
          logger.warn(`getToken attempt ${attempt + 1} failed:`, tokenError?.code ?? tokenError);
          if (Platform.OS === 'ios' && tokenError?.code === 'messaging/unregistered') {
            await messaging().registerDeviceForRemoteMessages();
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (!token) {
        logger.warn('Could not obtain an FCM token after retries');
        return null;
      }

      this.fcmToken = token;
      return this.fcmToken;
    } catch (error) {
      logger.error('Error getting FCM token:', error);
      return null;
    }
  }

  /** Subscribe to FCM token refreshes; the callback re-registers the new token. */
  onTokenRefresh(callback: (token: string) => void) {
    return messaging().onTokenRefresh((token) => {
      this.fcmToken = token;
      callback(token);
    });
  }

  async getDeviceInfo() {
    return {
      platform: Platform.OS,
      deviceId: Constants.sessionId || 'unknown',
      deviceName: Constants.deviceName || 'Unknown Device',
    };
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      logger.log('📬 Notification received (foreground):', notification);
      onNotificationReceived?.(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.log('👆 Notification tapped:', response);
      onNotificationTapped?.(response);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Firebase delivers foreground pushes to `onMessage`, not to expo-notifications.
   * Without this, a POINTS_EARNED (or any) FCM while the app is open never
   * shows a toast and never triggers a balance refetch.
   */
  setupFcmListeners(
    onForeground: (payload: {
      title?: string;
      body?: string;
      data: Record<string, string | undefined>;
    }) => void,
    onOpened: (data: Record<string, string | undefined>) => void,
  ) {
    if (Platform.OS === 'web') {
      return () => {};
    }

    const unsubMessage = messaging().onMessage(async (remoteMessage) => {
      logger.log('📬 FCM received (foreground):', remoteMessage);
      onForeground({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: flattenFcmData(remoteMessage.data),
      });
    });

    const unsubOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      logger.log('👆 FCM tapped (background):', remoteMessage);
      onOpened(flattenFcmData(remoteMessage.data));
    });

    return () => {
      unsubMessage();
      unsubOpened();
    };
  }

  async getInitialFcmData(): Promise<Record<string, string | undefined> | null> {
    if (Platform.OS === 'web') return null;
    try {
      const initial = await messaging().getInitialNotification();
      return initial ? flattenFcmData(initial.data) : null;
    } catch (e) {
      logger.warn('getInitialNotification failed', e);
      return null;
    }
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }
}

export default NotificationService.getInstance();
