import { logger } from '@/utils/logger';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
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

      // Use native device token for direct Firebase Admin SDK integration
      const nativeToken = await Notifications.getDevicePushTokenAsync();
      this.fcmToken = nativeToken.data as string;
      return this.fcmToken;
    } catch (error) {
      logger.error('Error getting FCM token:', error);
      return null;
    }
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

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }
}

export default NotificationService.getInstance();
