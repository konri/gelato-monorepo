import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS = gql`
  query MyNotifications($category: NotificationCategory) {
    myNotifications(category: $category) {
      id
      category
      type
      title
      message
      imageUrl
      isRead
      createdAt
    }
  }
`;

export const UNREAD_NOTIFICATIONS_COUNT = gql`
  query UnreadNotificationsCount($category: NotificationCategory) {
    unreadNotificationsCount(category: $category)
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId)
  }
`;
