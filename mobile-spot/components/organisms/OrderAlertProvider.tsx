import { Typography } from '@/components/atoms/Typography';
import { useOrderAlertSound } from '@/hooks/useOrderAlertSound';
import { useSpotOrderSubscription } from '@/hooks/useSpotOrderSubscription';
import { claimOrder } from '@/hooks/useSpotOrders';
import { Ionicons } from '@expo/vector-icons';
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

/**
 * App-wide incoming-order alert. When a new order arrives it shows a
 * non-dismissable modal (no backdrop tap, no close button) with an audible
 * alert — someone must Accept it. Accepting claims the order (making them
 * responsible); if another staff member claims it first, it's removed from
 * the queue. Mounted once at the root for logged-in staff.
 */
export function OrderAlertProvider({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [queue, setQueue] = useState<AlertOrder[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't alert on the login screen even if a stale socket fires.
  const active = enabled && queue.length > 0 && pathname !== '/login';
  useOrderAlertSound(active);

  const current = queue[0] ?? null;

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

  useSpotOrderSubscription(enabled, {
    onNewOrder: (payload) => {
      const order = normalize(payload);
      if (!order) return;
      setQueue((q) => (q.some((x) => x.id === order.id) ? q : [...q, order]));
    },
    onOrderClaimed: (payload) => {
      // Someone claimed an order — drop it from our alert queue.
      const claimedId = payload?.order?.id ?? payload?.orderId ?? payload?.id;
      if (claimedId) setQueue((q) => q.filter((x) => x.id !== claimedId));
    },
  });

  // Clear the queue when logging out / disabling.
  useEffect(() => {
    if (!enabled) setQueue([]);
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
        setQueue((q) => q.filter((x) => x.id !== current.id));
      } else {
        setError(res.error.message ?? t('OrderAlert.error'));
      }
      return;
    }
    setQueue((q) => q.filter((x) => x.id !== current.id));
  };

  if (!active || !current) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/70 p-6">
        <View className="w-full max-w-md rounded-3xl bg-white p-6">
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
            {t('OrderAlert.hint')}
          </Typography>
        </View>
      </View>
    </Modal>
  );
}
