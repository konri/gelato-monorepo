import { config } from '@/config';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { createClient, type Client } from 'graphql-ws';
import { useEffect, useRef } from 'react';

// Backend graphql-ws endpoint (http(s):// → ws(s)://, same /graphql path).
const WS_URL = config.GRAPHQL_API_URL.replace(/^http/, 'ws');

const NEW_ORDER_SUB = `
  subscription { newOrderNotification }
`;
const ORDER_CLAIMED_SUB = `
  subscription { orderClaimed }
`;

type Handlers = {
  onNewOrder?: (payload: any) => void;
  onOrderClaimed?: (payload: any) => void;
};

/**
 * Live spot-order notifications over graphql-ws. Subscribes to new incoming
 * orders (staff must claim one) and to claims (so a claimed order disappears
 * from everyone else). Reconnects automatically; tears down on unmount.
 */
export function useSpotOrderSubscription(enabled: boolean, handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    let client: Client | null = null;
    let disposed = false;
    const disposers: Array<() => void> = [];

    (async () => {
      const token = await safeGetItem('access_token');
      if (disposed) return;

      client = createClient({
        url: WS_URL,
        connectionParams: { authorization: token ? `Bearer ${token}` : '' },
        retryAttempts: Infinity,
      });

      const parse = (data: unknown) => {
        // Subscriptions return JSON-encoded strings from the backend.
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return data;
          }
        }
        return data;
      };

      disposers.push(
        client.subscribe(
          { query: NEW_ORDER_SUB },
          {
            next: (msg: any) => {
              const raw = msg?.data?.newOrderNotification;
              if (raw != null) handlersRef.current.onNewOrder?.(parse(raw));
            },
            error: () => {},
            complete: () => {},
          },
        ),
      );

      disposers.push(
        client.subscribe(
          { query: ORDER_CLAIMED_SUB },
          {
            next: (msg: any) => {
              const raw = msg?.data?.orderClaimed;
              if (raw != null) handlersRef.current.onOrderClaimed?.(parse(raw));
            },
            error: () => {},
            complete: () => {},
          },
        ),
      );
    })();

    return () => {
      disposed = true;
      disposers.forEach((d) => d());
      client?.dispose();
    };
  }, [enabled]);
}
