import { config } from '@/config';
import { clientConnectionParams } from '@/shared/api-client/src/clientInfo';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { logger } from '@/utils/logger';
import { createClient, type Client } from 'graphql-ws';

/**
 * The app's single graphql-ws client (BRANDS_SPEC §4.4). Created by
 * RealtimeProvider for the signed-in user and disposed on sign-out, on a user
 * change and when the server closes the socket with 4401 (revoked token or
 * disabled login). The socket carries subscriptions only.
 */

// Backend graphql-ws endpoint (http(s):// → ws(s)://, same /graphql path).
const WS_URL = config.GRAPHQL_API_URL.replace(/^http/, 'ws');

/** Server close code for a revoked token / disabled login. */
export const WS_CLOSE_UNAUTHORIZED = 4401;

type CloseLike = { code?: number };
const closeCode = (event: unknown): number | undefined =>
  event && typeof event === 'object' ? (event as CloseLike).code : undefined;

export type RealtimeClientHooks = {
  /** Every (re)connect; consumers resync what they may have missed. */
  onConnected?: (wasRetry: boolean) => void;
  /** The server closed the socket with 4401. */
  onUnauthorized?: () => void;
};

let current: Client | null = null;

export function createRealtimeClient(hooks: RealtimeClientHooks = {}): Client {
  disposeRealtime();
  const client = createClient({
    url: WS_URL,
    // Re-read the token on every (re)connect so a refresh mid-session doesn't
    // leave us subscribed as anonymous after the socket drops.
    connectionParams: async () => {
      const token = await safeGetItem('access_token');
      return {
        authorization: token ? `Bearer ${token}` : '',
        ...clientConnectionParams(),
      };
    },
    retryAttempts: Infinity,
    // 4401 = revoked / disabled: do not hammer the server with retries.
    shouldRetry: (errOrCloseEvent) => closeCode(errOrCloseEvent) !== WS_CLOSE_UNAUTHORIZED,
    keepAlive: 12_000,
    lazy: false,
    on: {
      connected: (_socket, _payload, wasRetry) => {
        hooks.onConnected?.(!!wasRetry);
      },
      closed: (event) => {
        if (closeCode(event) === WS_CLOSE_UNAUTHORIZED) hooks.onUnauthorized?.();
      },
      error: (error) => {
        logger.warn('graphql-ws error', error);
      },
    },
  });
  current = client;
  return client;
}

/** The current client (null when signed out). */
export function getRealtimeClient(): Client | null {
  return current;
}

/** Closes the socket and drops every subscription. Safe to call repeatedly. */
export function disposeRealtime(): void {
  const client = current;
  current = null;
  if (!client) return;
  try {
    void client.dispose();
  } catch (e) {
    logger.warn('graphql-ws dispose failed', e);
  }
}
