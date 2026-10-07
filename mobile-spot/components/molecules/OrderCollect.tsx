import { Typography } from '@/components/atoms/Typography';
import { PickupElsewhereBanner } from '@/components/molecules/Scan/PickupElsewhereBanner';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { spotStore } from '@/stores/spotStore';
import { messageForError } from '@/utils/errorCodes';
import {
  collectPickupOrder,
  getCollectablePickupOrders,
  getPickupOrdersElsewhere,
  type CollectablePickupOrder,
  type LoyaltyCard,
  type PickupElsewhere,
} from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

/**
 * Collect order after a card scan (BRANDS_SPEC §4.8): the customer's open
 * pickup orders at this spot. Cash orders are settled and earn points on
 * collection. When nothing waits here, the customer's orders at the brand's
 * other spots are shown: switch there, or send the customer there.
 */
export function OrderCollect({
  customer,
  spotId,
  onDone,
}: {
  customer: LoyaltyCard;
  spotId: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { activeSpot, setActiveSpot } = useActiveSpot();

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [orders, setOrders] = useState<CollectablePickupOrder[]>([]);
  const [elsewhere, setElsewhere] = useState<PickupElsewhere[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Per-order confirmation of the points earned at collection.
  const [collected, setCollected] = useState<Record<string, number>>({});

  const brandName = customer.brandName || activeSpot?.brandName || '';
  const stale = useCallback(() => spotStore.getActiveSpotId() !== spotId, [spotId]);

  const loadElsewhere = useCallback(async () => {
    const res = await getPickupOrdersElsewhere(spotId, customer.id, { silent: true });
    if (!stale()) setElsewhere(res.data ?? []);
  }, [spotId, customer.id, stale]);

  const load = useCallback(async () => {
    setState('loading');
    const res = await getCollectablePickupOrders(spotId, customer.id, { silent: true });
    if (stale()) return;
    if (res.error) {
      setError(messageForError(res.error, t('Scan.collectLoadError')));
      setState('error');
      return;
    }
    const list = res.data ?? [];
    setOrders(list);
    setState('ready');
    if (list.length === 0) void loadElsewhere();
  }, [spotId, customer.id, stale, loadElsewhere, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const collect = async (order: CollectablePickupOrder) => {
    setBusyId(order.id);
    setError(null);
    const res = await collectPickupOrder(order.id, { silent: true });
    if (stale()) return;
    setBusyId(null);
    if (res.error || !res.data) {
      setError(messageForError(res.error, t('Scan.collectError')));
      return;
    }
    setCollected((c) => ({ ...c, [order.id]: res.data!.pointsAwarded }));
    const rest = orders.filter((o) => o.id !== order.id);
    setOrders(rest);
    if (rest.length === 0) void loadElsewhere();
  };

  if (state === 'loading') {
    return (
      <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
        <ActivityIndicator color="#EC2828" />
        <Typography variant="body-small-regular" className="mt-3 text-gray-600">
          {t('Scan.lookingUpOrders')}
        </Typography>
      </View>
    );
  }

  const justCollected = Object.entries(collected);

  return (
    <View className="gap-4">
      {error && (
        <View className="rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
          <Typography variant="body-base-regular" style={{ color: '#B91C1C' }}>
            {error}
          </Typography>
        </View>
      )}

      <View className="rounded-2xl border border-gray-200 bg-white p-4">
        <Typography variant="body-lg-bold" className="text-text-primary">
          {customer.name?.trim() || t('Scan.customer')}
        </Typography>
        {!!customer.loyaltyCode && (
          <Typography variant="body-base-regular" className="text-gray-600">
            {customer.loyaltyCode}
          </Typography>
        )}
      </View>

      {justCollected.map(([id, pts]) => (
        <View key={id} className="flex-row items-center rounded-2xl border border-green-200 bg-green-50 p-4">
          <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
          <Typography variant="body-base-semibold" className="ml-2 flex-1" style={{ color: '#14532D' }}>
            {pts > 0 ? t('Scan.collectedWithPointsAtBrand', { count: pts, brand: brandName }) : t('Scan.collectedDone')}
          </Typography>
        </View>
      ))}

      {state === 'ready' && orders.length === 0 ? (
        elsewhere.length > 0 ? (
          elsewhere.map((o) => (
            <PickupElsewhereBanner
              key={o.orderId}
              order={o}
              canSwitch={spotStore.isAccessible(o.spotId)}
              onSwitch={(id) => void setActiveSpot(id, 'user')}
            />
          ))
        ) : (
          <View className="items-center rounded-2xl border border-gray-200 bg-white p-8">
            <Ionicons name="bag-check-outline" size={40} color="#6B7280" />
            <Typography variant="body-base-regular" className="mt-3 text-center text-gray-600">
              {justCollected.length ? t('Scan.noMoreOrders') : t('Scan.noPickupOrders')}
            </Typography>
          </View>
        )
      ) : (
        orders.map((order) => {
          const isCash = order.paymentStatus !== 'paid';
          const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
          const busy = busyId === order.id;
          return (
            <View key={order.id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Typography variant="body-lg-bold" className="text-text-primary">
                  #{order.orderNumber}
                </Typography>
                <View className="rounded-full px-3 py-1" style={{ backgroundColor: isCash ? '#FEF3C7' : '#DCFCE7' }}>
                  <Typography variant="body-small-semibold" style={{ color: isCash ? '#92400E' : '#15803D' }}>
                    {isCash ? t('Scan.payAtSpot') : t('Scan.paidOnline')}
                  </Typography>
                </View>
              </View>
              <Typography variant="body-base-regular" className="mt-1 text-gray-600">
                {t('Scan.itemsAndTotal', { count: itemCount, total: zl(order.total) })}
              </Typography>
              <Pressable
                onPress={() => void collect(order)}
                disabled={!!busyId}
                accessibilityRole="button"
                className="mt-3 items-center justify-center rounded-xl"
                style={{ minHeight: 56, backgroundColor: busy ? '#F4A3A3' : '#EC2828' }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Typography variant="body-base-bold" className="text-white">
                    {isCash ? t('Scan.collectAndCharge', { total: zl(order.total) }) : t('Scan.markCollected')}
                  </Typography>
                )}
              </Pressable>
            </View>
          );
        })
      )}

      {state === 'error' && (
        <Pressable
          onPress={() => void load()}
          accessibilityRole="button"
          className="items-center justify-center rounded-xl"
          style={{ minHeight: 56, backgroundColor: '#EC2828' }}
        >
          <Typography variant="body-base-bold" className="text-white">
            {t('Scan.tryAgain')}
          </Typography>
        </Pressable>
      )}

      <Pressable
        onPress={onDone}
        accessibilityRole="button"
        className="items-center justify-center rounded-xl border border-gray-300 bg-white"
        style={{ minHeight: 56 }}
      >
        <Typography variant="body-base-bold" className="text-gray-700">
          {t('Scan.done')}
        </Typography>
      </Pressable>
    </View>
  );
}
