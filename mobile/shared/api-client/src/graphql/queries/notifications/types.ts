import { ApolloServerConfig } from '../../types';

/**
 * Notification kind emitted by the backend (see FCMService.NotificationType).
 * Used to pick an icon/route; not an exhaustive union since new types may be
 * added server-side, so consumers should tolerate unknown values.
 */
export type NotificationType =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_PICKED_UP'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'COURIER_ASSIGNED'
  | 'COURIER_NEARBY'
  | 'POINTS_EARNED'
  | 'POINTS_REDEEMED'
  | 'PRIZE_AVAILABLE'
  | 'QUEST_COMPLETED'
  | 'NEWS_PUBLISHED'
  | 'SPOT_ANNOUNCEMENT'
  | 'REFERRAL_REWARD';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  type: NotificationType | string;
  isRead: boolean;
  createdAt: string;
};

export type MyNotificationsResponse = {
  myNotifications: AppNotification[];
};

export type UnreadNotificationCountResponse = {
  unreadNotificationCount: number;
};

export type MarkNotificationReadResponse = {
  markNotificationRead: boolean;
};

export type NotificationsQueryOptions = ApolloServerConfig & {
  unreadOnly?: boolean;
  limit?: number;
};
