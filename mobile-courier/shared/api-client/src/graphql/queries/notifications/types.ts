import { ApolloServerConfig } from '../../types';

/**
 * Notification kind emitted by the backend. Persisted bell rows use lowercase/
 * kind strings (e.g. 'order', 'COURIER_APPROVED'); consumers should tolerate
 * unknown values.
 */
export type NotificationType =
  | 'order'
  | 'NEWS'
  | 'COURIER_APPROVED'
  | 'COURIER_REJECTED'
  | 'DELIVERY_INCIDENT'
  | 'DELIVERY_BROADCAST'
  | string;

export type NotificationData = {
  orderId?: string;
  orderNumber?: string;
  spotId?: string;
  spotName?: string;
  status?: string;
  [key: string]: unknown;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  type: NotificationType;
  data?: NotificationData | null;
  isRead: boolean;
  createdAt: string;
};

export type MyNotificationsResponse = {
  myNotifications: AppNotification[];
};

export type NotificationResponse = {
  notification: AppNotification | null;
};

export type UnreadNotificationCountResponse = {
  unreadNotificationCount: number;
};

export type MarkNotificationReadResponse = {
  markNotificationRead: boolean;
};

export type MarkAllNotificationsReadResponse = {
  markAllNotificationsRead: boolean;
};

export type NotificationsQueryOptions = ApolloServerConfig & {
  unreadOnly?: boolean;
  limit?: number;
};
