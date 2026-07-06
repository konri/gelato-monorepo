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
      </View>

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
