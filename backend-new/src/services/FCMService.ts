import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

/**
 * Notification types for different events
 */
export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_PREPARING = 'ORDER_PREPARING',
  ORDER_READY = 'ORDER_READY',
  ORDER_PICKED_UP = 'ORDER_PICKED_UP',
  ORDER_OUT_FOR_DELIVERY = 'ORDER_OUT_FOR_DELIVERY',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  COURIER_ASSIGNED = 'COURIER_ASSIGNED',
  COURIER_NEARBY = 'COURIER_NEARBY',
  COURIER_APPROVED = 'COURIER_APPROVED',
  COURIER_REJECTED = 'COURIER_REJECTED',
  POINTS_EARNED = 'POINTS_EARNED',
  POINTS_REDEEMED = 'POINTS_REDEEMED',
  PRIZE_AVAILABLE = 'PRIZE_AVAILABLE',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  NEWS_PUBLISHED = 'NEWS_PUBLISHED',
  SPOT_ANNOUNCEMENT = 'SPOT_ANNOUNCEMENT',
  REFERRAL_REWARD = 'REFERRAL_REWARD',
}

/**
 * Notification data structure
 */
export interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Multi-language notification templates
 */
const notificationTemplates: Record<
  NotificationType,
  Record<'pl' | 'en' | 'ua', { title: string; body: string }>
> = {
  [NotificationType.ORDER_PLACED]: {
    pl: {
      title: 'Zamówienie złożone',
      body: 'Twoje zamówienie #{orderId} zostało przyjęte i jest przetwarzane.',
    },
    en: {
      title: 'Order Placed',
      body: 'Your order #{orderId} has been received and is being processed.',
    },
    ua: {
      title: 'Замовлення розміщено',
      body: 'Ваше замовлення #{orderId} отримано і обробляється.',
    },
  },
  [NotificationType.ORDER_CONFIRMED]: {
    pl: {
      title: 'Zamówienie potwierdzone',
      body: 'Lodziara {spotName} potwierdziła Twoje zamówienie.',
    },
    en: {
      title: 'Order Confirmed',
      body: '{spotName} has confirmed your order.',
    },
    ua: {
      title: 'Замовлення підтверджено',
      body: '{spotName} підтвердив ваше замовлення.',
    },
  },
  [NotificationType.ORDER_PREPARING]: {
    pl: {
      title: 'Przygotowujemy Twoje lody',
      body: 'Twoje zamówienie jest właśnie przygotowywane przez {spotName}.',
    },
    en: {
      title: 'Preparing Your Ice Cream',
      body: 'Your order is being prepared by {spotName}.',
    },
    ua: {
      title: 'Готуємо ваше морозиво',
      body: 'Ваше замовлення готується {spotName}.',
    },
  },
  [NotificationType.ORDER_READY]: {
    pl: {
      title: 'Zamówienie gotowe!',
      body: 'Twoje lody są gotowe. Kurier wkrótce je odbierze.',
    },
    en: {
      title: 'Order Ready!',
      body: 'Your ice cream is ready. A courier will pick it up soon.',
    },
    ua: {
      title: 'Замовлення готове!',
      body: "Ваше морозиво готове. Кур'єр незабаром його забере.",
    },
  },
  [NotificationType.ORDER_PICKED_UP]: {
    pl: {
      title: 'Kurier odebrał zamówienie',
      body: 'Twoje zamówienie jest w drodze do Ciebie.',
    },
    en: {
      title: 'Order Picked Up',
      body: 'Your order is on its way to you.',
    },
    ua: {
      title: 'Замовлення забрано',
      body: 'Ваше замовлення їде до вас.',
    },
  },
  [NotificationType.ORDER_OUT_FOR_DELIVERY]: {
    pl: {
      title: 'W drodze do Ciebie!',
      body: 'Kurier {courierName} dostarczy Twoje zamówienie za około {estimatedTime} min.',
    },
    en: {
      title: 'On the Way!',
      body: 'Courier {courierName} will deliver your order in about {estimatedTime} min.',
    },
    ua: {
      title: 'В дорозі до вас!',
      body: "Кур'єр {courierName} доставить замовлення приблизно за {estimatedTime} хв.",
    },
  },
  [NotificationType.COURIER_NEARBY]: {
    pl: {
      title: 'Kurier jest blisko!',
      body: 'Twoje zamówienie dotrze za kilka minut.',
    },
    en: {
      title: 'Courier Nearby!',
      body: 'Your order will arrive in a few minutes.',
    },
    ua: {
      title: "Кур'єр поруч!",
      body: 'Ваше замовлення прибуде за кілька хвилин.',
    },
  },
  [NotificationType.ORDER_DELIVERED]: {
    pl: {
      title: 'Zamówienie dostarczone',
      body: 'Smacznego! Oceń swoją dostawę.',
    },
    en: {
      title: 'Order Delivered',
      body: 'Enjoy! Please rate your delivery.',
    },
    ua: {
      title: 'Замовлення доставлено',
      body: 'Смачного! Будь ласка, оцініть доставку.',
    },
  },
  [NotificationType.ORDER_CANCELLED]: {
    pl: {
      title: 'Zamówienie anulowane',
      body: 'Twoje zamówienie #{orderId} zostało anulowane.',
    },
    en: {
      title: 'Order Cancelled',
      body: 'Your order #{orderId} has been cancelled.',
    },
    ua: {
      title: 'Замовлення скасовано',
      body: 'Ваше замовлення #{orderId} скасовано.',
    },
  },
  [NotificationType.COURIER_ASSIGNED]: {
    pl: {
      title: 'Nowa dostawa!',
      body: 'Przypisano Ci nowe zamówienie z {spotName}.',
    },
    en: {
      title: 'New Delivery!',
      body: 'A new order from {spotName} has been assigned to you.',
    },
    ua: {
      title: 'Нова доставка!',
      body: 'Вам призначено нове замовлення з {spotName}.',
    },
  },
  [NotificationType.COURIER_APPROVED]: {
    pl: {
      title: 'Zostałeś zatwierdzony! 🎉',
      body: '{spotName} zatwierdził Cię jako kuriera. Możesz już rozpocząć dostawy.',
    },
    en: {
      title: "You're approved! 🎉",
      body: '{spotName} approved you as a courier. You can start delivering now.',
    },
    ua: {
      title: 'Вас схвалено! 🎉',
      body: '{spotName} схвалив вас як кур\'єра. Можете починати доставляти.',
    },
  },
  [NotificationType.COURIER_REJECTED]: {
    pl: {
      title: 'Wniosek rozpatrzony',
      body: '{spotName} nie zatwierdził Twojego wniosku o dostawy.',
    },
    en: {
      title: 'Application reviewed',
      body: '{spotName} did not approve your delivery application.',
    },
    ua: {
      title: 'Заявку розглянуто',
      body: '{spotName} не схвалив вашу заявку на доставки.',
    },
  },
  [NotificationType.POINTS_EARNED]: {
    pl: {
      title: 'Zdobyłeś punkty!',
      body: '+{points} pkt. Masz teraz {totalPoints} punktów.',
    },
    en: {
      title: 'Points Earned!',
      body: '+{points} pts. You now have {totalPoints} points.',
    },
    ua: {
      title: 'Отримано бали!',
      body: '+{points} балів. Тепер у вас {totalPoints} балів.',
    },
  },
  [NotificationType.POINTS_REDEEMED]: {
    pl: {
      title: 'Punkty wykorzystane',
      body: 'Wykorzystano {points} pkt na {prizeName}.',
    },
    en: {
      title: 'Points Redeemed',
      body: '{points} pts redeemed for {prizeName}.',
    },
    ua: {
      title: 'Бали використано',
      body: '{points} балів використано на {prizeName}.',
    },
  },
  [NotificationType.PRIZE_AVAILABLE]: {
    pl: {
      title: 'Nowa nagroda!',
      body: 'Nowa nagroda "{prizeName}" jest dostępna za {points} pkt.',
    },
    en: {
      title: 'New Prize Available!',
      body: 'New prize "{prizeName}" available for {points} pts.',
    },
    ua: {
      title: 'Нова нагорода!',
      body: 'Нова нагорода "{prizeName}" доступна за {points} балів.',
    },
  },
  [NotificationType.QUEST_COMPLETED]: {
    pl: {
      title: 'Misja ukończona!',
      body: 'Ukończyłeś "{questName}" i zdobyłeś {points} pkt!',
    },
    en: {
      title: 'Quest Completed!',
      body: 'You completed "{questName}" and earned {points} pts!',
    },
    ua: {
      title: 'Місію виконано!',
      body: 'Ви виконали "{questName}" та отримали {points} балів!',
    },
  },
  [NotificationType.NEWS_PUBLISHED]: {
    pl: {
      title: 'Nowości!',
      body: '{newsTitle}',
    },
    en: {
      title: 'News!',
      body: '{newsTitle}',
    },
    ua: {
      title: 'Новини!',
      body: '{newsTitle}',
    },
  },
  [NotificationType.SPOT_ANNOUNCEMENT]: {
    pl: {
      title: 'Ogłoszenie od {spotName}',
      body: '{message}',
    },
    en: {
      title: 'Announcement from {spotName}',
      body: '{message}',
    },
    ua: {
      title: 'Оголошення від {spotName}',
      body: '{message}',
    },
  },
  [NotificationType.REFERRAL_REWARD]: {
    pl: {
      title: 'Nagroda za polecenie!',
      body: 'Zdobyłeś {points} pkt za polecenie znajomemu!',
    },
    en: {
      title: 'Referral Reward!',
      body: 'You earned {points} pts for referring a friend!',
    },
    ua: {
      title: 'Винагорода за рекомендацію!',
      body: 'Ви отримали {points} балів за рекомендацію друга!',
    },
  },
};

/**
 * Firebase Cloud Messaging Service
 *
 * Handles push notifications for all mobile apps:
 * - Client app: Order updates, points, prizes, news
 * - Courier app: Delivery assignments, route updates
 * - Spot admin app: New orders, courier updates
 */
export class FCMService {
  private static initialized = false;

  /**
   * Initialize Firebase Admin SDK
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!serviceAccountPath && !projectId) {
      console.warn('⚠️  Firebase credentials not configured. Push notifications disabled.');
      return;
    }

    try {
      if (serviceAccountPath) {
        // Initialize with service account file
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (projectId) {
        // Initialize with project ID (uses Application Default Credentials)
        admin.initializeApp({
          projectId,
        });
      }

      this.initialized = true;
      console.log('✅ Firebase Cloud Messaging initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
    }
  }

  /**
   * Build notification from template with variable substitution
   */
  private static buildNotification(
    type: NotificationType,
    language: 'pl' | 'en' | 'ua',
    variables: Record<string, string> = {}
  ): { title: string; body: string } {
    const template = notificationTemplates[type][language];
    let { title, body } = template;

    // Replace variables in title and body
    Object.entries(variables).forEach(([key, value]) => {
      title = title.replace(`{${key}}`, value);
      body = body.replace(`{${key}}`, value);
    });

    return { title, body };
  }

  /**
   * Send notification to a single device
   */
  static async sendToDevice(
    fcmToken: string,
    type: NotificationType,
    language: 'pl' | 'en' | 'ua' = 'pl',
    variables: Record<string, string> = {},
    additionalData: Record<string, string> = {}
  ): Promise<boolean> {
    if (!this.initialized) {
      console.warn('FCM not initialized. Skipping notification.');
      return false;
    }

    try {
      const { title, body } = this.buildNotification(type, language, variables);

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          type,
          ...variables,
          ...additionalData,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'gelato_notifications',
          },
        },
      };

      await admin.messaging().send(message);
      console.log(`📱 Notification sent: ${type} to ${fcmToken.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
      return false;
    }
  }

  /**
   * Send notification to a user (looks up their FCM tokens)
   */
  static async sendToUser(
    userId: string,
    type: NotificationType,
    variables: Record<string, string> = {},
    additionalData: Record<string, string> = {},
    prisma: PrismaClient
  ): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        language: true,
        deviceTokens: {
          where: {
            isActive: true,
          },
          select: {
            token: true,
          },
        },
      },
    });

    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      return 0;
    }

    const language = user.language.toLowerCase() as 'pl' | 'en' | 'ua';
    let successCount = 0;

    for (const deviceToken of user.deviceTokens) {
      const sent = await this.sendToDevice(deviceToken.token, type, language, variables, additionalData);
      if (sent) successCount++;
    }

    return successCount;
  }

  /**
   * Send notification to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    type: NotificationType,
    variables: Record<string, string> = {},
    additionalData: Record<string, string> = {},
    prisma: PrismaClient
  ): Promise<number> {
    let totalSent = 0;

    for (const userId of userIds) {
      const sent = await this.sendToUser(userId, type, variables, additionalData, prisma);
      totalSent += sent;
    }

    return totalSent;
  }

  /**
   * Send notification to topic (e.g., all clients, all couriers)
   */
  static async sendToTopic(
    topic: string,
    type: NotificationType,
    language: 'pl' | 'en' | 'ua' = 'pl',
    variables: Record<string, string> = {},
    additionalData: Record<string, string> = {}
  ): Promise<boolean> {
    if (!this.initialized) {
      console.warn('FCM not initialized. Skipping notification.');
      return false;
    }

    try {
      const { title, body } = this.buildNotification(type, language, variables);

      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: {
          type,
          ...variables,
          ...additionalData,
        },
      };

      await admin.messaging().send(message);
      console.log(`📢 Topic notification sent: ${type} to ${topic}`);
      return true;
    } catch (error) {
      console.error('Failed to send topic notification:', error);
      return false;
    }
  }

  /**
   * Subscribe user to topic
   */
  static async subscribeToTopic(
    fcmTokens: string[],
    topic: string
  ): Promise<number> {
    if (!this.initialized || fcmTokens.length === 0) {
      return 0;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(fcmTokens, topic);
      console.log(`✅ Subscribed ${response.successCount} tokens to topic: ${topic}`);
      return response.successCount;
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      return 0;
    }
  }

  /**
   * Unsubscribe user from topic
   */
  static async unsubscribeFromTopic(
    fcmTokens: string[],
    topic: string
  ): Promise<number> {
    if (!this.initialized || fcmTokens.length === 0) {
      return 0;
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(fcmTokens, topic);
      console.log(`✅ Unsubscribed ${response.successCount} tokens from topic: ${topic}`);
      return response.successCount;
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
      return 0;
    }
  }
}

// Initialize FCM on module load
FCMService.initialize();
