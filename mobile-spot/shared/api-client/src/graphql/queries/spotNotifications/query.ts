import { gql } from '@apollo/client';

// `spotId` narrows the bell to one spot (rows without a spot are always
// included by the server); omitted = every spot of the staff member.
export const MY_NOTIFICATIONS_QUERY = gql`
  query MyNotifications($unreadOnly: Boolean, $limit: Int, $spotId: ID) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit, spotId: $spotId) {
      id
      title
      body
      imageUrl
      type
      data
      isRead
      createdAt
      spotId
      spotName
      brandId
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT_QUERY = gql`
  query UnreadNotificationCount($spotId: ID) {
    unreadNotificationCount(spotId: $spotId)
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead($spotId: ID) {
    markAllNotificationsRead(spotId: $spotId)
  }
`;
