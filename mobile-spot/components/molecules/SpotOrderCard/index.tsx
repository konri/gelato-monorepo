import { Typography } from '@/components/atoms/Typography';
import { SpotOrder } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

type Props = {
  order: SpotOrder;
  currentUserId: string | null;
  onClaim: (id: string) => Promise<void>;
  onMarkReady: (id: string) => Promise<void>;
};

// One spot order. PENDING → big Accept button (claim to prepare). PREPARING →
// shows who's preparing + a Mark ready action for the claimer.
export function SpotOrderCard({ order, currentUserId, onClaim, onMarkReady }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const itemCount = order.items?.reduce((s, i) => s + (i.quantity ?? 1), 0) ?? 0;
  const isPending = order.status === 'PENDING';
  const isPickup = order.fulfillmentType === 'PICKUP';
  const minePreparing =
    order.status === 'PREPARING' && order.preparedById === currentUserId;

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      className="rounded-2xl bg-white p-4 shadow-sm"
      style={isPending ? { borderWidth: 2, borderColor: '#EC2828' } : undefined}
    >
      <View className="flex-row items-center justify-between">
        <Typography variant="body-base-bold" className="text-text-primary">
          {t('Spot.orderNumber', { number: order.orderNumber })}
        </Typography>
        <Typography variant="body-base-bold" className="text-primary">
          {order.total.toFixed(2)} zł
        </Typography>
      </View>

      <View className="mt-1 flex-row items-center">
        <Ionicons name="cube-outline" size={15} color="#6B7280" />
        <Typography variant="body-small-regular" className="ml-2 text-gray-600">
          {t('Spot.itemsCount', { count: itemCount })}
        </Typography>
        {/* Fulfillment badge so staff know pickup orders have no courier. */}
        <View
          className="ml-2 flex-row items-center rounded-full px-2 py-0.5"
          style={{ backgroundColor: isPickup ? '#FEECEC' : '#EEF2FF' }}
        >
          <Ionicons
            name={isPickup ? 'storefront-outline' : 'bicycle-outline'}
            size={12}
            color={isPickup ? '#EC2828' : '#4F46E5'}
          />
          <Typography
            variant="body-very-small-medium"
            className="ml-1"
            style={{ color: isPickup ? '#EC2828' : '#4F46E5' }}
          >
            {t(isPickup ? 'Spot.pickup' : 'Spot.delivery')}
          </Typography>
        </View>
      </View>

      {/* Customer — who ordered. */}
      {!!order.customerName && (
        <View className="mt-1 flex-row items-center">
          <Ionicons name="person-outline" size={15} color="#6B7280" />
          <Typography variant="body-small-regular" className="ml-2 text-gray-600">
            {order.customerName}
          </Typography>
        </View>
      )}

      {/* What to prepare: line items with names + quantities. */}
      {order.items?.length > 0 && (
        <View className="mt-2 rounded-lg bg-gray-50 p-2.5">
          {order.items.map((it) => (
            <View key={it.id} className="mb-1">
              <View className="flex-row">
                <Typography variant="body-small-semibold" className="text-text-primary">
                  {it.quantity}×
                </Typography>
                <Typography variant="body-small-regular" className="ml-2 flex-1 text-text-primary">
                  {it.displayName ?? t('Spot.item')}
                </Typography>
              </View>
              {!!it.boxTasteNames?.length && (
                <Typography variant="body-very-small-medium" className="ml-5 text-gray-500">
                  {it.boxTasteNames.join(', ')}
                </Typography>
              )}
            </View>
          ))}
        </View>
      )}

      {!!order.noteForSpot && (
        <View className="mt-2 rounded-lg bg-amber-50 p-2">
          <Typography variant="body-small-regular" style={{ color: '#92400E' }}>
            {t('Spot.note')}: {order.noteForSpot}
          </Typography>
        </View>
      )}

      {isPending ? (
        <Pressable
          onPress={() => wrap(() => onClaim(order.id))}
          disabled={busy}
          className="mt-3 items-center rounded-xl py-3"
          style={{ backgroundColor: busy ? '#F4A3A3' : '#EC2828' }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Typography variant="body-base-bold" className="text-white">
              {t('Spot.claim')}
            </Typography>
          )}
        </Pressable>
      ) : (
        <View className="mt-3">
          <Typography variant="body-small-semibold" style={{ color: '#15803D' }}>
            {minePreparing
              ? t('Spot.claimedByYou')
              : t('Spot.claimedBy', { name: order.preparedByName ?? '—' })}
          </Typography>
          {minePreparing && order.status === 'PREPARING' && (
            <Pressable
              onPress={() => wrap(() => onMarkReady(order.id))}
              disabled={busy}
              className="mt-2 items-center rounded-xl py-3"
              style={{ backgroundColor: busy ? '#86EFAC' : '#22C55E' }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('Spot.markReady')}
                </Typography>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
