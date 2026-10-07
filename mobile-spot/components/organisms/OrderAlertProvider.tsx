import { Typography } from '@/components/atoms/Typography';
import { useSpotRealtime } from '@/components/organisms/RealtimeProvider';
import { useSession } from '@/contexts/SessionProvider';
import { useActiveSpot, useSpotState } from '@/hooks/useActiveSpot';
import { useOrderAlertSound } from '@/hooks/useOrderAlertSound';
import { claimOrder } from '@/hooks/useSpotOrders';
import { onForegroundNotification } from '@/shared/api-client/src/notificationEvents';
import { spotStore } from '@/stores/spotStore';
import { getSpotOrders } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';

type AlertOrder = {
  id: string;
  orderNumber?: string;
  total?: number;
  deliveryAddress?: string;
  itemCount?: number;
};

const PENDING_POLL_MS = 15_000;

/**
 * App-wide incoming-order alert for the ACTIVE spot. When a new order arrives
 * it shows a modal with an audible alert. Accepting claims the order (making
 * them responsible); if another staff member claims it first, it's removed
 * from the queue.
 *
 * When more than one person works the spot, a close (X) lets someone dismiss
 * the popup without claiming — the order stays in the queue for colleagues.
 * A lone worker still has to Accept (no X), so the order can't be silenced.
 *
 * Enabled only when signed in with an active spot, and never on the login or
 * choose-spot screens. A spot switch resets the queue. Orders at the user's
 * other spots never pop up here (they show in the strip / as a toast).
 * Mounted once at the root.
 */
export function OrderAlertProvider() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const session = useSession();
  const { status, activeSpot, activeSpotId: spotId, canSwitch } = useActiveSpot();
  const { staffKind } = useSpotState();
  const [queue, setQueue] = useState<AlertOrder[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissedRef = useRef(new Set<string>());

  const enabled =
    session.status === 'signedIn' &&
    status === 'ready' &&
    !!spotId &&
    pathname !== '/login' &&
    pathname !== '/choose-spot';

  // Someone else can take the order: other members with a profile at the spot.
  // StaffSpot.staffCount counts spot admins and employees (not brand admins),
  // so a brand admin / Loodly team member working here is not in it.
  const selfCounted = staffKind === 'SPOT_ADMIN' || staffKind === 'EMPLOYEE';
  const staffCount = activeSpot?.staffCount ?? 0;
  const canDismiss = selfCounted ? staffCount > 1 : staffCount >= 1;

  const active = enabled && queue.length > 0;
  useOrderAlertSound(active);

  const current = queue[0] ?? null;

  const enqueue = useCallback((order: AlertOrder) => {
    if (dismissedRef.current.has(order.id)) return;
    setQueue((q) => (q.some((x) => x.id === order.id) ? q : [...q, order]));
  }, []);

  const drop = useCallback((orderId: string) => {
    setQueue((q) => q.filter((x) => x.id !== orderId));
  }, []);

  const normalize = useCallback((payload: any): AlertOrder | null => {
    // newOrderNotification payload = { spotId, spotName, brandId, order }.
    if (payload?.spotId && payload.spotId !== spotStore.getActiveSpotId()) return null;
    const o = payload?.order ?? payload;
    if (!o?.id) return null;
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total,
      deliveryAddress: o.deliveryAddress,
      itemCount: Array.isArray(o.items)
        ? o.items.reduce((n: number, it: any) => n + (it.quantity ?? 1), 0)
        : undefined,
    };
  }, []);

  const loadPending = useCallback(async () => {
    if (!spotId) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotOrders(spotId, 'PENDING', { token });
    // Stale guard: the spot changed while the request was in flight.
    if (spotStore.getActiveSpotId() !== spotId) return;
    const pending = (res.data ?? []).filter((o) => !o.preparedById);
    for (const o of pending) {
      enqueue({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        deliveryAddress: o.deliveryAddress ?? undefined,
        itemCount: Array.isArray(o.items)
          ? o.items.reduce((n, it) => n + (it.quantity ?? 1), 0)
          : undefined,
      });
    }
  }, [enqueue, spotId]);

  // Live events for the active spot (RealtimeProvider subscribes with
  // spotIds: [activeSpotId] and drops other spots' events).
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  useSpotRealtime({
    onNewOrder: (payload) => {
      if (!enabledRef.current) return;
      const order = normalize(payload);
      if (!order) return;
      enqueue(order);
    },
    onOrderClaimed: (payload) => {
      const claimedId = payload?.order?.id ?? payload?.orderId ?? payload?.id;
      if (claimedId) {
        dismissedRef.current.delete(claimedId);
        drop(claimedId);
      }
    },
    onResync: () => {
      if (enabledRef.current) void loadPending();
    },
  });

  // Foreground FCM (websocket down / backgrounded tab) → same modal. Pushes
  // for another spot are ignored here; NotificationBridge toasts those.
  useEffect(() => {
    if (!enabled) return;
    return onForegroundNotification((data) => {
      const kind = data.kind || data.type || '';
      if (kind !== 'SPOT_NEW_ORDER') return;
      if (!data.orderId) return;
      if (data.spotId && data.spotId !== spotStore.getActiveSpotId()) return;
      enqueue({
        id: data.orderId,
        orderNumber: data.orderNumber,
      });
    });
  }, [enabled, enqueue]);

  // Seed + poll unclaimed PENDING orders so a missed websocket still pops up.
  useEffect(() => {
    if (!enabled) return;
    void loadPending();
    const id = setInterval(() => void loadPending(), PENDING_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, loadPending]);

  // A different spot (or signing out / disabling): start from a clean queue.
  useEffect(() => {
    dismissedRef.current.clear();
    setQueue([]);
    setError(null);
  }, [spotId, enabled]);

  const accept = async () => {
    if (!current) return;
    setClaiming(true);
    setError(null);
    const res = await claimOrder(current.id);
    setClaiming(false);
    if (res.error) {
      // Already claimed elsewhere (or closed meanwhile) → just drop it;
      // otherwise surface the error.
      const m = res.error.message?.toLowerCase() ?? '';
      if (m.includes('already') || m.includes('closed')) {
        drop(current.id);
      } else {
        setError(res.error.message ?? t('OrderAlert.error'));
      }
      return;
    }
    drop(current.id);
  };

  const dismiss = () => {
    if (!current || !canDismiss) return;
    dismissedRef.current.add(current.id);
    setError(null);
    drop(current.id);
  };

  if (!active || !current) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={canDismiss ? dismiss : () => {}}>
      <View className="flex-1 items-center justify-center bg-black/70 p-6">
        <View className="w-full max-w-md rounded-3xl bg-white p-6">
          {canDismiss && (
            <Pressable
              onPress={dismiss}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('OrderAlert.dismiss')}
              className="absolute z-10 h-10 w-10 items-center justify-center rounded-full"
              style={{ top: 12, right: 12, backgroundColor: '#F3F4F6' }}
            >
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          )}
          <View className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#FEECEC' }}>
              <Ionicons name="notifications" size={32} color="#EC2828" />
            </View>
            <Typography variant="heading-32-bold" className="mt-4 text-center text-text-primary">
              {t('OrderAlert.title')}
            </Typography>
            {canSwitch && activeSpot && (
              <Typography variant="body-lg-semibold" className="text-center text-text-primary">
                {t('OrderAlert.atSpot', { spot: activeSpot.name })}
              </Typography>
            )}
            {queue.length > 1 && (
              <View className="mt-2 rounded-full px-3 py-1" style={{ backgroundColor: '#EC2828' }}>
                <Typography variant="body-small-bold" className="text-white">
                  {t('OrderAlert.more', { count: queue.length - 1 })}
                </Typography>
              </View>
            )}
          </View>

          <View className="mt-5 rounded-2xl bg-gray-50 p-4">
            {current.orderNumber && (
              <Typography variant="body-lg-bold" className="text-text-primary">
                {t('Spot.orderNumber', { number: current.orderNumber })}
              </Typography>
            )}
            {current.itemCount != null && (
              <Typography variant="body-small-regular" className="mt-1 text-gray-600">
                {t('OrderAlert.items', { count: current.itemCount })}
                {current.total != null ? ` · ${current.total.toFixed(2)} zł` : ''}
              </Typography>
            )}
            {current.deliveryAddress && (
              <Typography variant="body-small-regular" className="mt-1 text-gray-500">
                📍 {current.deliveryAddress}
              </Typography>
            )}
          </View>

          {error && (
            <View className="mt-3 rounded-xl bg-red-50 px-4 py-2.5">
              <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
                {error}
              </Typography>
            </View>
          )}

          <Pressable
            onPress={accept}
            disabled={claiming}
            className="mt-5 items-center rounded-xl py-4"
            style={{ backgroundColor: claiming ? '#F4A3A3' : '#EC2828' }}
          >
            {claiming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-base-bold" className="text-white">
                {t('OrderAlert.accept')}
              </Typography>
            )}
          </Pressable>
          <Typography variant="body-very-small-medium" className="mt-3 text-center text-gray-400">
            {t(canDismiss ? 'OrderAlert.hintDismissable' : 'OrderAlert.hint')}
          </Typography>
        </View>
      </View>
    </Modal>
  );
}
