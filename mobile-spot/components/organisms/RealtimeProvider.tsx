import { useToast } from '@/components/organisms/ToastProvider';
import { session as sessionStore, useSession } from '@/contexts/SessionProvider';
import { useActiveSpotId } from '@/hooks/useActiveSpot';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { refreshAccessToken } from '@/shared/api-client/src/graphql/refreshToken';
import { createRealtimeClient, disposeRealtime } from '@/shared/realtime/wsClient';
import { spotStore } from '@/stores/spotStore';
import { logger } from '@/utils/logger';
import type { Client } from 'graphql-ws';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Subject } from 'rxjs';

/**
 * One graphql-ws client for the whole app (BRANDS_SPEC §4.4), replacing the
 * two separate clients of the root alert and the Orders tab.
 *
 *   - Created for the signed-in user (a different user = a new client);
 *     disposed on sign-out and when the server closes with 4401.
 *   - Staff subscriptions pass `spotIds: [activeSpotId]` and are swapped on
 *     every spot switch (the socket stays open); each event is also dropped
 *     client-side unless it is for the active spot.
 *   - Every (re)connect and every swap emits `resync`, so consumers refetch
 *     what they may have missed; a reconnect also revalidates the spot context.
 *
 * Consumers: `useSpotRealtime({ onNewOrder, onOrderClaimed, onDeliveryIncident, onResync })`.
 */

export type RealtimeEventType = 'newOrder' | 'orderClaimed' | 'deliveryIncident' | 'resync';

export type RealtimeEvent = {
  type: RealtimeEventType;
  /** The spot the event belongs to (absent for `resync`). */
  spotId?: string;
  /** Parsed JSON payload: `{ spotId, spotName, brandId, order | incident }`. */
  payload?: any;
};

const bus = new Subject<RealtimeEvent>();

const SpotNewOrders = `
  subscription SpotNewOrders($spotIds: [ID!]) {
    newOrderNotification(spotIds: $spotIds)
  }
`;
const SpotOrderClaimed = `
  subscription SpotOrderClaimed($spotIds: [ID!]) {
    orderClaimed(spotIds: $spotIds)
  }
`;
const SpotDeliveryIncident = `
  subscription SpotDeliveryIncident($spotIds: [ID!]) {
    deliveryIncident(spotIds: $spotIds)
  }
`;

const SUBSCRIPTIONS: { query: string; field: string; type: RealtimeEventType }[] = [
  { query: SpotNewOrders, field: 'newOrderNotification', type: 'newOrder' },
  { query: SpotOrderClaimed, field: 'orderClaimed', type: 'orderClaimed' },
  { query: SpotDeliveryIncident, field: 'deliveryIncident', type: 'deliveryIncident' },
];

const RESUBSCRIBE_DELAY_MS = 5000;
const RECONNECT_REFRESH_GAP_MS = 30_000;

// The subscriptions return JSON-encoded strings.
const parse = (data: unknown): any => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
};

const errorCodes = (err: unknown): string[] => {
  const list = Array.isArray(err) ? err : [err];
  return list
    .map((e) => (e && typeof e === 'object' ? (e as { extensions?: { code?: unknown } }).extensions?.code : undefined))
    .filter((c): c is string => typeof c === 'string');
};

/** Subscribes to realtime events while mounted (handlers may change freely). */
export function useSpotRealtime(handlers: {
  onNewOrder?: (payload: any) => void;
  onOrderClaimed?: (payload: any) => void;
  onDeliveryIncident?: (payload: any) => void;
  onResync?: () => void;
}): void {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const sub = bus.subscribe((event) => {
      const h = ref.current;
      if (event.type === 'newOrder') h.onNewOrder?.(event.payload);
      else if (event.type === 'orderClaimed') h.onOrderClaimed?.(event.payload);
      else if (event.type === 'deliveryIncident') h.onDeliveryIncident?.(event.payload);
      else h.onResync?.();
    });
    return () => sub.unsubscribe();
  }, []);
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const toast = useToast();
  const session = useSession();
  const activeSpotId = useActiveSpotId();
  const userId = session.status === 'signedIn' ? session.userId ?? 'anonymous' : null;

  const [client, setClient] = useState<Client | null>(null);
  // Bumped to recreate the client after a 4401 that turned out recoverable.
  const [clientGen, setClientGen] = useState(0);
  // Bumped to re-run the subscriptions (after an auth refresh or an error).
  const [subGen, setSubGen] = useState(0);

  // One client per signed-in user.
  useEffect(() => {
    if (!userId) {
      disposeRealtime();
      setClient(null);
      return;
    }
    const created = createRealtimeClient({
      onConnected: (wasRetry) => {
        bus.next({ type: 'resync' });
        // Revalidate the spot context (skipped right after a fresh fetch, e.g.
        // the first connect after login).
        const { fetchedAt } = spotStore.getState();
        if (wasRetry || !fetchedAt || Date.now() - fetchedAt > RECONNECT_REFRESH_GAP_MS) {
          void spotStore.refresh('wsReconnect');
        }
      },
      onUnauthorized: () => {
        // Revoked token or disabled login: drop the socket and let an HTTP
        // request decide (refresh, else the session expires → login).
        disposeRealtime();
        setClient(null);
        void spotStore.refresh('wsUnauthorized').then(() => {
          if (sessionStore.getState().status === 'signedIn') setClientGen((g) => g + 1);
        });
      },
    });
    setClient(created);
    return () => {
      disposeRealtime();
      setClient(null);
    };
  }, [userId, clientGen]);

  // Staff subscriptions for the active spot; swapped on every switch.
  useEffect(() => {
    if (!client || !activeSpotId) return;
    const spotId = activeSpotId;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleResubscribe = () => {
      if (cancelled || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (!cancelled) setSubGen((g) => g + 1);
      }, RESUBSCRIBE_DELAY_MS);
    };

    // The three subscriptions fail together; recover once per run.
    let recovering = false;
    const onError = async (err: unknown) => {
      if (cancelled || recovering) return;
      recovering = true;
      const codes = errorCodes(err);
      logger.warn('staff subscription error', codes.length ? codes : err);
      if (codes.includes('UNAUTHENTICATED')) {
        // The socket authenticated with an expired token: refresh, then
        // reconnect (connectionParams re-read the token) and resubscribe.
        const token = await refreshAccessToken();
        if (cancelled) return;
        if (!token) {
          void sessionStore.expire();
          return;
        }
        client.terminate();
      }
      scheduleResubscribe();
    };

    const unsubscribers = SUBSCRIPTIONS.map(({ query, field, type }) =>
      client.subscribe(
        { query, variables: { spotIds: [spotId] } },
        {
          next: (msg: any) => {
            const raw = msg?.data?.[field];
            if (raw == null) return;
            const payload = parse(raw);
            const eventSpot: string | undefined = payload?.spotId ?? undefined;
            // Defense in depth: only the active spot's events.
            if (eventSpot && eventSpot !== spotStore.getActiveSpotId()) return;
            bus.next({ type, spotId: eventSpot ?? spotId, payload });
          },
          error: (err) => {
            void onError(err);
          },
          complete: () => {},
        },
      ),
    );
    // Nothing is missed during the swap: consumers refetch.
    bus.next({ type: 'resync' });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribers.forEach((u) => u());
    };
  }, [client, activeSpotId, subGen]);

  // A courier reported a problem at the active spot.
  useEffect(() => {
    const sub = bus.subscribe((event) => {
      if (event.type !== 'deliveryIncident') return;
      const number = event.payload?.incident?.orderNumber;
      refreshEmitter.emit();
      if (number) toast.show(t('SpotAttention.incidentToast', { number }), 'info');
    });
    return () => sub.unsubscribe();
  }, [t, toast]);

  return <>{children}</>;
}
