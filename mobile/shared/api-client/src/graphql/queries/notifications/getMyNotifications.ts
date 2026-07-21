import { executeGraphQLQuery } from '../../client';
import {
  MY_NOTIFICATIONS,
  UNREAD_NOTIFICATION_COUNT,
  MARK_NOTIFICATION_READ,
} from './myNotifications';
import {
  AppNotification,
  MarkNotificationReadResponse,
  MyNotificationsResponse,
  NotificationsQueryOptions,
  UnreadNotificationCountResponse,
} from './types';
import { GraphQLResult } from '../../types';

export const getMyNotifications = async (
  options: NotificationsQueryOptions = {},
): Promise<GraphQLResult<AppNotification[]>> => {
  const { unreadOnly, limit, ...apolloOptions } = options;
  const result = await executeGraphQLQuery<MyNotificationsResponse>(MY_NOTIFICATIONS, {
    ...apolloOptions,
    variables: { unreadOnly, limit },
  });

  return {
    ...result,
    data: result.data ? result.data.myNotifications : null,
  };
};

export const getUnreadNotificationCount = async (
  options: NotificationsQueryOptions = {},
): Promise<GraphQLResult<number>> => {
  const { unreadOnly, limit, ...apolloOptions } = options;
  const result = await executeGraphQLQuery<UnreadNotificationCountResponse>(
    UNREAD_NOTIFICATION_COUNT,
    { ...apolloOptions },
  );

  return {
    ...result,
    data: result.data ? result.data.unreadNotificationCount : null,
  };
};

export const markNotificationRead = async (
  options: NotificationsQueryOptions & { notificationId: string },
): Promise<GraphQLResult<boolean>> => {
  const { notificationId, unreadOnly, limit, ...apolloOptions } = options;
  const result = await executeGraphQLQuery<MarkNotificationReadResponse>(
    MARK_NOTIFICATION_READ,
    { ...apolloOptions, variables: { id: notificationId } },
  );

  return {
    ...result,
    data: result.data ? result.data.markNotificationRead : null,
  };
};
