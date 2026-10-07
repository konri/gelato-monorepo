import { config } from '@/config';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { clientConnectionParams } from '@/shared/api-client/src/clientInfo';
import { refreshAccessToken } from '@/shared/api-client/src/graphql/refreshToken';
import { emitPointsUpdated } from '@/shared/api-client/src/pointsEvents';
import { onLoggedOut, onSessionExpired } from '@/shared/api-client/src/session';
import { emitUpgradeRequired, upgradeInfoFrom } from '@/shared/api-client/src/upgradeEvents';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { logger } from '@/utils/logger';
import { createClient, type Client } from 'graphql-ws';
import { useEffect, useRef, useState } from 'react';

const WS_URL = config.GRAPHQL_API_URL.replace(/^http/, 'ws');

// Every brand's wallet changes on one socket (BRANDS_SPEC §5.2).
const POINTS_UPDATED_SUB = `
  subscription PointsUpdated {
    pointsUpdated(allBrands: true) {
      userId
      totalPoints
      availablePoints
      change
      brandId
      brandName
      brandAvailablePoints
      brandTotalPoints
      source
      spotId
      spotName
    }
  }
`;

type PointsUpdatedPayload = {
  userId?: string;
  totalPoints?: number;
  availablePoints?: number;
  change?: number;
  brandId?: string | null;
  brandName?: string | null;
  brandAvailablePoints?: number | null;
  brandTotalPoints?: number | null;
  source?: string | null;
  spotId?: string | null;
  spotName?: string | null;
};

type ErrorWithCode = { extensions?: Record<string, unknown> };

/** The server closes a socket whose token was revoked with 4401 (CONTRACTS §18). */
const CLOSE_REVOKED = 4401;
/** Consecutive auth recoveries before giving up (HTTP requests then log out). */
const MAX_AUTH_RESTARTS = 3;

const isCloseEvent = (e: unknown): e is { code: number } =>
  !!e && typeof e === 'object' && typeof (e as { code?: unknown }).code === 'number';

const errorCodes = (err: unknown): ErrorWithCode[] =>
  Array.isArray(err) ? (err as ErrorWithCode[]) : [];

/**
 * Live loyalty balance over graphql-ws. When staff awards points (or any other
 * credit lands), this fires so My card can count up immediately — push
 * notifications are not required while the app is open.
 *
 * - Sends the client headers in `connectionParams` (upgrade gate).
 * - UNAUTHENTICATED / close 4401: refreshes the access token once and
 *   reconnects with the new one (the token is read per connection).
 * - UPGRADE_REQUIRED: raises the upgrade gate.
 * - Logout / session expiry: the socket closes at once and stays closed for
 *   this mount (the tab layout's own auth state can lag behind); every update
 *   carries its `userId` so receivers drop another user's data (review #1).
 */
export function usePointsSubscription(enabled: boolean) {
  const [generation, setGeneration] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const authRestarts = useRef(0);
  // Closes the live socket (idempotent); set while one is open.
  const closeSocket = useRef<(() => void) | null>(null);

  // Re-arm when the caller's login state changes (a new session).
  useEffect(() => {
    setSessionEnded(false);
  }, [enabled]);

  useEffect(() => {
    const end = () => {
      // Synchronously, before any later message or token refresh can run.
      closeSocket.current?.();
      setSessionEnded(true);
    };
    const unsubLogout = onLoggedOut(end);
    const unsubExpired = onSessionExpired(end);
    return () => {
      unsubLogout();
      unsubExpired();
    };
  }, []);

  useEffect(() => {
    if (!enabled || sessionEnded) return;

    let disposed = false;

    const recoverAuth = async () => {
      if (disposed || authRestarts.current >= MAX_AUTH_RESTARTS) return;
      authRestarts.current += 1;
      const token = await refreshAccessToken();
      if (token && !disposed) setGeneration((g) => g + 1);
    };

    const client: Client = createClient({
      url: WS_URL,
      connectionParams: async () => {
        const token = await safeGetItem('access_token');
        return {
          authorization: token ? `Bearer ${token}` : '',
          ...clientConnectionParams(),
        };
      },
      retryAttempts: Infinity,
      // A revoked token would be refused again: recover it instead of looping.
      shouldRetry: (e) => !(isCloseEvent(e) && e.code === CLOSE_REVOKED),
      keepAlive: 12_000,
      lazy: false,
      on: {
        closed: (event) => {
          if (isCloseEvent(event) && event.code === CLOSE_REVOKED) void recoverAuth();
        },
      },
    });

    const unsubscribe = client.subscribe(
      { query: POINTS_UPDATED_SUB },
      {
        next: (msg: { data?: { pointsUpdated?: PointsUpdatedPayload } }) => {
          if (disposed) return;
          const update = msg?.data?.pointsUpdated;
          if (!update || typeof update.availablePoints !== 'number') return;
          authRestarts.current = 0;
          const available = update.brandAvailablePoints ?? update.availablePoints;
          const total = update.brandTotalPoints ?? update.totalPoints ?? available;
          emitPointsUpdated({
            userId: update.userId ?? null,
            availablePoints: available,
            totalPoints: total,
            change: update.change ?? 0,
            brandId: update.brandId ?? null,
            brandName: update.brandName ?? null,
            brandAvailablePoints: update.brandAvailablePoints ?? null,
            brandTotalPoints: update.brandTotalPoints ?? null,
            source: update.source ?? null,
            spotId: update.spotId ?? null,
            spotName: update.spotName ?? null,
          });
          refreshEmitter.emit();
        },
        error: (err) => {
          const errors = errorCodes(err);
          const upgrade = errors.find((e) => e?.extensions?.code === 'UPGRADE_REQUIRED');
          if (upgrade) {
            emitUpgradeRequired(upgradeInfoFrom(upgrade.extensions));
            return;
          }
          if (errors.some((e) => e?.extensions?.code === 'UNAUTHENTICATED')) {
            void recoverAuth();
            return;
          }
          logger.warn('pointsUpdated subscription error', err);
        },
        complete: () => {},
      },
    );

    const close = () => {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      void client.dispose();
    };
    closeSocket.current = close;

    return () => {
      if (closeSocket.current === close) closeSocket.current = null;
      close();
    };
  }, [enabled, generation, sessionEnded]);
}
