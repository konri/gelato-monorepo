import { executeGraphQLQuery } from '../../client';
import {
  MY_NOTIFICATIONS,
  UNREAD_NOTIFICATIONS_COUNT,
  MARK_NOTIFICATION_AS_READ,
} from './myNotifications';
import {
  AppNotification,
  MarkNotificationAsReadResponse,
  MyNotificationsResponse,
  NotificationsQueryOptions,
  UnreadNotificationsCountResponse,
} from './types';
import { GraphQLResult } from '../../types';

export const getMyNotifications = async (
  options: NotificationsQueryOptions = {},
): Promise<GraphQLResult<AppNotification[]>> => {
  const { category, ...apolloOptions } = options;
  const result = await executeGraphQLQuery<MyNotificationsResponse>(MY_NOTIFICATIONS, {
    ...apolloOptions,
    variables: { category },
  });

  return {
    ...result,
    data: result.data ? result.data.myNotifications : null,
  };
};

export const getUnreadNotificationsCount = async (
  options: NotificationsQueryOptions = {},
): Promise<GraphQLResult<number>> => {
  const { category, ...apolloOptions } = options;
  const result = await executeGraphQLQuery<UnreadNotificationsCountResponse>(
    UNREAD_NOTIFICATIONS_COUNT,
    { ...apolloOptions, variables: { category } },
  );

  return {
    ...result,
    data: result.data ? result.data.unreadNotificationsCount : null,
  };
};

export const markNotificationAsRead = async (
  options: NotificationsQueryOptions & { notificationId: string },
): Promise<GraphQLResult<boolean>> => {
  const { notificationId, category, ...apolloOptions } = options;
  const result = await executeGraphQLQuery<MarkNotificationAsReadResponse>(
    MARK_NOTIFICATION_AS_READ,
    { ...apolloOptions, variables: { notificationId } },
  );

  return {
    ...result,
    data: result.data ? result.data.markNotificationAsRead : null,
  };
};
