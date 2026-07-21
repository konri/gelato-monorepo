export type SpotNotification = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  type: string;
  data?: { orderId?: string; [key: string]: unknown } | null;
  isRead: boolean;
  createdAt: string;
};

export type SpotMyNotificationsResponse = { myNotifications: SpotNotification[] };
export type SpotUnreadCountResponse = { unreadNotificationCount: number };
