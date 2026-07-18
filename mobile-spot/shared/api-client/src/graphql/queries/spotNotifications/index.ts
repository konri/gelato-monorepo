import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  MY_NOTIFICATIONS_QUERY,
  UNREAD_NOTIFICATION_COUNT_QUERY,
  MARK_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
} from './query';
import {
  SpotNotification,
  SpotMyNotificationsResponse,
  SpotUnreadCountResponse,
} from './types';

export * from './types';

// Distinct names (Spot*) to avoid clashing with the legacy Bonapka-template
// notifications module still present in the barrel.
export const getMySpotNotifications = async (
  options: ApolloServerConfig & { unreadOnly?: boolean } = {},
): Promise<GraphQLResult<SpotNotification[]>> => {
  const { unreadOnly, ...apollo } = options;
  const res = await executeGraphQLQuery<SpotMyNotificationsResponse>(MY_NOTIFICATIONS_QUERY, {
    ...apollo,
    variables: { unreadOnly: unreadOnly ?? false, limit: 50 },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.myNotifications : null };
};

export const getSpotUnreadCount = async (
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<number>> => {
  const res = await executeGraphQLQuery<SpotUnreadCountResponse>(
    UNREAD_NOTIFICATION_COUNT_QUERY,
    { ...options, fetchPolicy: 'network-only' },
  );
  return { ...res, data: res.data ? res.data.unreadNotificationCount : null };
};

export const markSpotNotificationRead = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ markNotificationRead: boolean }>(
    MARK_NOTIFICATION_READ_MUTATION,
    { ...options, variables: { id } },
  );
  return { ...res, data: res.data ? res.data.markNotificationRead : null };
};

export const markAllSpotNotificationsRead = async (
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<boolean>> => {
  const res = await executeGraphQLQuery<{ markAllNotificationsRead: boolean }>(
    MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    { ...options },
  );
  return { ...res, data: res.data ? res.data.markAllNotificationsRead : null };
};
