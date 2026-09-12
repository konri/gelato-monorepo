import { Typography } from '@/components/atoms/Typography';
import { useOrderAlertSound } from '@/hooks/useOrderAlertSound';
import { useSpotOrderSubscription } from '@/hooks/useSpotOrderSubscription';
import { claimOrder, getStoredSpotContext } from '@/hooks/useSpotOrders';
import { onForegroundNotification } from '@/shared/api-client/src/notificationEvents';
import { getSpotOrders, getSpotStaffAdmins, getSpotStaffEmployees } from '@repo/api-client';
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
 * App-wide incoming-order alert. When a new order arrives it shows a modal
 * with an audible alert. Accepting claims the order (making them responsible);
 * if another staff member claims it first, it's removed from the queue.
 *
 * When more than one person works the spot, a close (X) lets someone dismiss
 * the popup without claiming — the order stays in the queue for colleagues.
 * A lone worker still has to Accept (no X), so the order can't be silenced.
 * Mounted once at the root for logged-in staff.
 */
export function OrderAlertProvider({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [queue, setQueue] = useState<AlertOrder[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canDismiss, setCanDismiss] = useState(false);
  const dismissedRef = useRef(new Set<string>());

  // Don't alert on the login screen even if a stale socket fires.
  const active = enabled && queue.length > 0 && pathname !== '/login';
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
    // newOrderNotification payload = { spotId, order }.
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
    const ctx = await getStoredSpotContext();
    if (!ctx.spotId) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotOrders(ctx.spotId, 'PENDING', { token });
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
  }, [enqueue]);

  const loadStaffCount = useCallback(async () => {
    const ctx = await getStoredSpotContext();
    if (!ctx.spotId) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const [admins, employees] = await Promise.all([
      getSpotStaffAdmins(ctx.spotId, { token }),
      getSpotStaffEmployees(ctx.spotId, { token }),
    ]);
    const adminIds = (admins.data ?? []).map((a) => a.id);
    const employeeIds = (employees.data ?? []).map((e) => e.id);
    const unique = new Set([...adminIds, ...employeeIds]);
    // Employees can't list staff — if the queries fail, still offer dismiss
    // so a colleague isn't stuck behind someone else's modal.
    if (unique.size === 0 && (admins.error || employees.error)) {
      setCanDismiss(true);
      return;
    }
    setCanDismiss(unique.size > 1);
  }, []);

  useSpotOrderSubscription(enabled, {
    onNewOrder: (payload) => {
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
  });

  // Foreground FCM (websocket down / backgrounded tab) → same modal.
  useEffect(() => {
    if (!enabled) return;
    return onForegroundNotification((data) => {
      const kind = data.kind || data.type || '';
      if (kind !== 'SPOT_NEW_ORDER') return;
      if (!data.orderId) return;
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
    void loadStaffCount();
    const id = setInterval(() => void loadPending(), PENDING_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, loadPending, loadStaffCount]);

  // Clear the queue when logging out / disabling.
  useEffect(() => {
    if (!enabled) {
      dismissedRef.current.clear();
      setQueue([]);
      setCanDismiss(false);
    }
  }, [enabled]);

  const accept = async () => {
    if (!current) return;
    setClaiming(true);
    setError(null);
    const res = await claimOrder(current.id);
    setClaiming(false);
    if (res.error) {
      // Already claimed elsewhere → just drop it; otherwise surface the error.
      if (res.error.message?.toLowerCase().includes('already')) {
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
