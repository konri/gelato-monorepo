import { getMyNotifications, AppNotification } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useNotificationsList = () => {
  return useGraphQLQuery<AppNotification[]>(getMyNotifications, {}, []);
};
