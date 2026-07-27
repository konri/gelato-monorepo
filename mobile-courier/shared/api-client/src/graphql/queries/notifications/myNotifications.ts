import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS = gql`
  query MyNotifications($unreadOnly: Boolean, $limit: Int) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit) {
      id
      title
      body
      imageUrl
      type
      data
      isRead
      createdAt
    }
  }
`;

export const NOTIFICATION = gql`
  query Notification($id: ID!) {
    notification(id: $id) {
      id
      title
      body
      imageUrl
      type
      data
      isRead
      createdAt
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;
