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
// `spotId`: only that spot's rows (plus rows without a spot); omitted = all.
export const getMySpotNotifications = async (
  options: ApolloServerConfig & { unreadOnly?: boolean; spotId?: string | null } = {},
): Promise<GraphQLResult<SpotNotification[]>> => {
  const { unreadOnly, spotId, ...apollo } = options;
  const res = await executeGraphQLQuery<SpotMyNotificationsResponse>(MY_NOTIFICATIONS_QUERY, {
    ...apollo,
    variables: { unreadOnly: unreadOnly ?? false, limit: 50, spotId: spotId ?? null },
    fetchPolicy: 'network-only',
  });
  return { ...res, data: res.data ? res.data.myNotifications : null };
};

export const getSpotUnreadCount = async (
  options: ApolloServerConfig & { spotId?: string | null } = {},
): Promise<GraphQLResult<number>> => {
  const { spotId, ...apollo } = options;
  const res = await executeGraphQLQuery<SpotUnreadCountResponse>(
    UNREAD_NOTIFICATION_COUNT_QUERY,
    { ...apollo, variables: { spotId: spotId ?? null }, fetchPolicy: 'network-only' },
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
  options: ApolloServerConfig & { spotId?: string | null } = {},
): Promise<GraphQLResult<boolean>> => {
  const { spotId, ...apollo } = options;
  const res = await executeGraphQLQuery<{ markAllNotificationsRead: boolean }>(
    MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    { ...apollo, variables: { spotId: spotId ?? null } },
  );
  return { ...res, data: res.data ? res.data.markAllNotificationsRead : null };
};
