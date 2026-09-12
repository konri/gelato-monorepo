import { getMyPointBalance, PointBalance } from '@repo/api-client';
import { onPointsUpdated } from '@/shared/api-client/src/pointsEvents';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useGraphQLQuery } from './useGraphQLQuery';
import { refreshEmitter } from './useRefreshEmitter';

export const usePointBalance = () => {
  const result = useGraphQLQuery<PointBalance>(
    getMyPointBalance,
    {},
    []
  );
  const [live, setLive] = useState<Pick<PointBalance, 'availablePoints' | 'totalPoints'> | null>(
    null,
  );

  // Instant overlay from the graphql-ws subscription so the Account tab can
  // animate before the follow-up myPointBalance refetch lands.
  useEffect(() => {
    return onPointsUpdated((update) => {
      setLive({
        availablePoints: update.availablePoints,
        totalPoints: update.totalPoints,
      });
    });
  }, []);

  useEffect(() => {
    if (!result.data) return;
    setLive((current) => {
      if (!current) return null;
      // Drop the overlay once the query has caught up. A stale in-flight
      // fetch can still return the old balance — keep the live credit then.
      if (result.data!.availablePoints === current.availablePoints) return null;
      return current;
    });
  }, [result.data]);

  // Balance is fetched per screen with no shared cache. Refetch whenever a
  // push arrives (refreshEmitter) or the app comes back to the foreground so
  // Home/Settings don't keep a stale number after redeeming or earning points.
  useEffect(() => {
    return refreshEmitter.subscribe(() => {
      void result.refetch();
    });
  }, [result.refetch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void result.refetch();
    });
    return () => sub.remove();
  }, [result.refetch]);

  const data: PointBalance | null = result.data
    ? {
        ...result.data,
        availablePoints: live?.availablePoints ?? result.data.availablePoints,
        totalPoints: live?.totalPoints ?? result.data.totalPoints,
      }
    : live
      ? { ...live, lockedPoints: 0 }
      : null;

  return { ...result, data };
};
