import { config } from '@/config';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { emitPointsUpdated } from '@/shared/api-client/src/pointsEvents';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { logger } from '@/utils/logger';
import { createClient, type Client } from 'graphql-ws';
import { useEffect, useRef } from 'react';

const WS_URL = config.GRAPHQL_API_URL.replace(/^http/, 'ws');

const POINTS_UPDATED_SUB = `
  subscription {
    pointsUpdated {
      userId
      totalPoints
      availablePoints
      change
    }
  }
`;

type PointsUpdatedPayload = {
  userId?: string;
  totalPoints?: number;
  availablePoints?: number;
  change?: number;
};

/**
 * Live loyalty balance over graphql-ws. When staff awards points (or any other
 * credit lands), this fires so the Account tab can count up immediately —
 * push notifications are not required while the app is open.
 */
export function usePointsSubscription(enabled: boolean) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) return;

    let client: Client | null = null;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      client = createClient({
        url: WS_URL,
        connectionParams: async () => {
          const token = await safeGetItem('access_token');
          return { authorization: token ? `Bearer ${token}` : '' };
        },
        retryAttempts: Infinity,
        shouldRetry: () => true,
        keepAlive: 12_000,
        lazy: false,
      });
      if (disposed) {
        client.dispose();
        return;
      }

      unsubscribe = client.subscribe(
        { query: POINTS_UPDATED_SUB },
        {
          next: (msg: { data?: { pointsUpdated?: PointsUpdatedPayload } }) => {
            const update = msg?.data?.pointsUpdated;
            if (!update || typeof update.availablePoints !== 'number') return;
            emitPointsUpdated({
              availablePoints: update.availablePoints,
              totalPoints: update.totalPoints ?? update.availablePoints,
              change: update.change ?? 0,
            });
            refreshEmitter.emit();
          },
          error: (err) => {
            logger.warn('pointsUpdated subscription error', err);
          },
          complete: () => {},
        },
      );
    })();

    return () => {
      disposed = true;
      unsubscribe?.();
      client?.dispose();
    };
  }, [enabled]);
}
