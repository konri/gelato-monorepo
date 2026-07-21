import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS_QUERY = gql`
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

export const UNREAD_NOTIFICATION_COUNT_QUERY = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;
