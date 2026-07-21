import { gql } from '@apollo/client';

export const MY_NOTIFICATIONS = gql`
  query MyNotifications($unreadOnly: Boolean, $limit: Int) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit) {
      id
      title
      body
      imageUrl
      type
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
