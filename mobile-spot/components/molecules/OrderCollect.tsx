import { Typography } from '@/components/atoms/Typography';
import {
  getLoyaltyCustomer,
  getCollectablePickupOrders,
  collectPickupOrder,
  type CollectablePickupOrder,
  type LoyaltyCustomer,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

/**
 * After scanning a customer's loyalty QR (or typing their account code), show
 * their open pickup orders at this spot so staff can mark them collected.
 * Cash orders are settled + earn points on collection.
 */
export function OrderCollect({
  userId,
  spotId,
  onDone,
}: {
  // The scanned customer id or loyalty code.
  userId: string;
  spotId: string | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();

  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading');
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [orders, setOrders] = useState<CollectablePickupOrder[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Per-order confirmation of points awarded after collecting.
  const [collected, setCollected] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!spotId) {
      setState('notfound');
      return;
    }
    setState('loading');
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const customerRes = await getLoyaltyCustomer(userId, { token });
    if (!customerRes.data) {
      setState('notfound');
      return;
    }
    setCustomer(customerRes.data);
    const ordersRes = await getCollectablePickupOrders(spotId, customerRes.data.id, { token });
    setOrders(ordersRes.data ?? []);
    setState('ready');
  }, [spotId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const collect = async (order: CollectablePickupOrder) => {
    setBusyId(order.id);
    setError(null);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res = await collectPickupOrder(order.id, { token });
      if (res.error || !res.data) {
        setError(res.error?.message || t('Scan.collectError'));
        return;
      }
      setCollected((c) => ({ ...c, [order.id]: res.data!.pointsAwarded }));
      // Drop it from the open list.
      setOrders((list) => list.filter((o) => o.id !== order.id));
    } finally {
      setBusyId(null);
    }
  };

  if (state === 'loading') {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
        <ActivityIndicator color="#EC2828" />
        <Typography variant="body-small-regular" className="mt-3 text-gray-500">
          {t('Scan.lookingUp')}
        </Typography>
      </View>
    );
  }

  if (state === 'notfound') {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
        <Ionicons name="alert-circle" size={48} color="#EC2828" />
        <Typography variant="body-base-bold" className="mt-3 text-center text-text-primary">
          {t('Scan.customerNotFound')}
        </Typography>
        <Pressable onPress={onDone} className="mt-5 rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
          <Typography variant="body-base-bold" className="text-white">
            {t('Scan.tryAgain')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  const justCollected = Object.entries(collected);

  return (
    <View className="gap-4">
      {error && (
        <View className="rounded-xl bg-red-50 px-4 py-3">
          <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
            {error}
          </Typography>
        </View>
      )}

      {/* Customer header */}
      {customer && (
        <View className="rounded-2xl border border-gray-200 bg-white p-4">
          <Typography variant="body-base-bold" className="text-text-primary">
            {customer.name || t('Scan.customer')}
          </Typography>
          {customer.loyaltyCode && (
            <Typography variant="body-small-regular" className="text-gray-500">
              {customer.loyaltyCode}
            </Typography>
          )}
        </View>
      )}

      {/* Just-collected confirmations */}
      {justCollected.map(([id, pts]) => (
        <View key={id} className="flex-row items-center rounded-2xl border border-green-200 bg-green-50 p-4">
          <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
          <Typography variant="body-small-semibold" className="ml-2 flex-1" style={{ color: '#15803D' }}>
            {pts > 0 ? t('Scan.collectedWithPoints', { points: pts }) : t('Scan.collectedDone')}
          </Typography>
        </View>
      ))}

      {/* Open pickup orders */}
      {orders.length === 0 ? (
        <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
          <Ionicons name="bag-check-outline" size={40} color="#9CA3AF" />
          <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
            {justCollected.length ? t('Scan.noMoreOrders') : t('Scan.noPickupOrders')}
          </Typography>
        </View>
      ) : (
        orders.map((order) => {
          const isCash = order.paymentStatus !== 'paid';
          const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
          return (
            <View key={order.id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Typography variant="body-base-bold" className="text-text-primary">
                  #{order.orderNumber}
                </Typography>
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: isCash ? '#FEF3C7' : '#DCFCE7' }}
                >
                  <Typography variant="body-very-small-medium" style={{ color: isCash ? '#92400E' : '#15803D' }}>
                    {isCash ? t('Scan.payAtSpot') : t('Scan.paidOnline')}
                  </Typography>
                </View>
              </View>
              <Typography variant="body-small-regular" className="mt-1 text-gray-500">
                {t('Scan.itemsAndTotal', { count: itemCount, total: zl(order.total) })}
              </Typography>
              <Pressable
                onPress={() => collect(order)}
                disabled={busyId === order.id}
                className="mt-3 items-center rounded-xl py-3.5"
                style={{ backgroundColor: busyId === order.id ? '#F4A3A3' : '#EC2828' }}
              >
                {busyId === order.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Typography variant="body-base-bold" className="text-white">
                    {isCash
                      ? t('Scan.collectAndCharge', { total: zl(order.total) })
                      : t('Scan.markCollected')}
                  </Typography>
                )}
              </Pressable>
            </View>
          );
        })
      )}

      <Pressable onPress={onDone} className="items-center rounded-xl border border-gray-300 bg-white py-3.5">
        <Typography variant="body-base-bold" className="text-gray-600">
          {t('Scan.done')}
        </Typography>
      </Pressable>
    </View>
  );
}
