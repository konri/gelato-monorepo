import { getUnreadNotificationCount } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useUnreadNotificationsCount = () => {
  return useGraphQLQuery<number>(getUnreadNotificationCount, {}, []);
};
