import { getUnreadNotificationCount } from '@repo/api-client';
import { useEffect } from 'react';
import { useGraphQLQuery } from './useGraphQLQuery';
import { refreshEmitter } from './useRefreshEmitter';

export const useUnreadNotificationsCount = () => {
  const result = useGraphQLQuery<number>(getUnreadNotificationCount, {}, []);

  useEffect(() => {
    return refreshEmitter.subscribe(() => {
      void result.refetch();
    });
  }, [result.refetch]);

  return result;
};
