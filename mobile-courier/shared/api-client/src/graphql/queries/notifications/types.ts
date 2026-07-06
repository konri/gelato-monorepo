import { ApolloServerConfig } from '../../types';

export type NotificationCategory = 'PROMOTIONS' | 'GENERAL' | 'SECURITY';

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  type: string;
  title: string;
  message: string;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export type MyNotificationsResponse = {
  myNotifications: AppNotification[];
};

export type UnreadNotificationsCountResponse = {
  unreadNotificationsCount: number;
};

export type MarkNotificationAsReadResponse = {
  markNotificationAsRead: boolean;
};

export type NotificationsQueryOptions = ApolloServerConfig & {
  category?: NotificationCategory;
};
