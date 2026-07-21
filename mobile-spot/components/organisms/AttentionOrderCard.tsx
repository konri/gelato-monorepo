import { Typography } from '@/components/atoms/Typography';
import { useToast } from '@/components/organisms/ToastProvider';
import { redispatchOrder, terminateOrder } from '@/hooks/useSpotOrders';
import { incidentLabel } from '@/utils/notificationDisplay';
import type { SpotOrder } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';

// Classifies an attention order into a bucket for the header + tint.
function bucket(o: SpotOrder): {
  key: 'held' | 'terminated' | 'cancelled' | 'failed';
  titleKey: string;
  color: string;
  bg: string;
} {
  const status = String(o.status);
  if (status === 'TERMINATED') {
    return { key: 'terminated', titleKey: 'SpotAttention.terminatedTitle', color: '#B45309', bg: '#FEF3C7' };
  }
  if (status === 'FAILED') {
    return { key: 'failed', titleKey: 'SpotAttention.failedTitle', color: '#DC2626', bg: '#FEE2E2' };
  }
  if (status === 'CANCELLED') {
    return { key: 'cancelled', titleKey: 'SpotAttention.cancelledTitle', color: '#6B7280', bg: '#F3F4F6' };
  }
  // PREPARING + incident = held after a courier issue.
  return { key: 'held', titleKey: 'SpotAttention.heldTitle', color: '#DC2626', bg: '#FEE2E2' };
}

// Best available reason string for why the order needs attention.
function reasonFor(o: SpotOrder, t: ReturnType<typeof useTranslation>['t']): string | null {
  if (o.incidentType) {
    const label = incidentLabel(t, o.incidentType);
    const note = o.incidentNote?.trim() || o.cancelReason?.trim();
    return note && note !== o.incidentType ? `${label} — ${note}` : label;
  }
  return o.terminationReason?.trim() || o.cancelReason?.trim() || null;
}

export function AttentionOrderCard({
  order,
  onChanged,
}: {
  order: SpotOrder;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const b = bucket(order);
  const reason = reasonFor(order, t);
  const phone = order.customerPhone?.trim();
  const isHeld = b.key === 'held';
  const refunded = !!order.refundedAt || String(order.status) === 'TERMINATED';
  // Dispute & refund available while the order isn't already refunded/terminated.
  const canDispute = !refunded;

  const call = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const doRedispatch = async () => {
    setBusy(true);
    try {
      const res = await redispatchOrder(order.id);
      if (res.error || !res.data) {
        toast.error(t('SpotAttention.redispatchFailed'));
      } else {
        toast.success(t('SpotAttention.redispatched'));
        onChanged();
      }
    } catch {
      toast.error(t('SpotAttention.redispatchFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmRedispatch = () => {
    if (busy) return;
    // Alert isn't available on web — go straight through.
    if (Platform.OS === 'web') {
      void doRedispatch();
      return;
    }
    Alert.alert(
      t('SpotAttention.redispatchTitle'),
      t('SpotAttention.redispatchConfirm'),
      [
        { text: t('SpotAttention.redispatchCancel'), style: 'cancel' },
        { text: t('SpotAttention.redispatchCta'), style: 'default', onPress: () => void doRedispatch() },
      ],
    );
  };

  const doDispute = async () => {
    setBusy(true);
    try {
      const res = await terminateOrder(order.id, reason ?? undefined);
      if (res.error || !res.data) {
        toast.error(t('SpotAttention.disputeFailed'));
      } else {
        toast.success(t('SpotAttention.disputed'));
        onChanged();
      }
    } catch {
      toast.error(t('SpotAttention.disputeFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDispute = () => {
    if (busy) return;
    if (Platform.OS === 'web') {
      void doDispute();
      return;
    }
    Alert.alert(
      t('SpotAttention.disputeTitle'),
      t('SpotAttention.disputeConfirm'),
      [
        { text: t('SpotAttention.disputeCancel'), style: 'cancel' },
        { text: t('SpotAttention.disputeCta'), style: 'destructive', onPress: () => void doDispute() },
      ],
    );
  };

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm" style={{ borderLeftWidth: 4, borderLeftColor: b.color }}>
      <Pressable onPress={() => router.push(`/order/${order.id}` as never)}>
        <View className="flex-row items-center justify-between">
          <Typography variant="body-base-bold" className="text-text-primary">
            {t('Spot.orderNumber', { number: order.orderNumber })}
          </Typography>
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: b.bg }}>
            <Typography variant="body-very-small-medium" style={{ color: b.color }}>
              {t(b.titleKey)}
            </Typography>
          </View>
        </View>

        {!!order.customerName && (
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Typography variant="body-small-regular" className="ml-1.5 text-gray-600">
              {order.customerName}
            </Typography>
          </View>
        )}

        {!!reason && (
          <View className="mt-2 rounded-lg bg-gray-50 p-2.5">
            <Typography variant="body-very-small-medium" className="text-gray-400">
              {t('SpotAttention.reason')}
            </Typography>
            <Typography variant="body-small-regular" className="mt-0.5 text-text-primary">
              {reason}
            </Typography>
          </View>
        )}

        {refunded && (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="cash-outline" size={14} color="#16A34A" />
            <Typography variant="body-very-small-medium" className="ml-1.5" style={{ color: '#16A34A' }}>
              {t('SpotAttention.refunded')}
            </Typography>
          </View>
        )}
      </Pressable>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={call}
          disabled={!phone}
          className="flex-1 flex-row items-center justify-center rounded-xl border py-2.5"
          style={{ borderColor: phone ? '#D1D5DB' : '#E5E7EB', opacity: phone ? 1 : 0.5 }}
        >
          <Ionicons name="call-outline" size={16} color="#374151" />
          <Typography variant="body-small-semibold" className="ml-1.5 text-gray-700">
            {phone ? t('SpotAttention.callCustomer') : t('SpotAttention.noPhone')}
          </Typography>
        </Pressable>

        {canDispute && (
          <Pressable
            onPress={confirmDispute}
            disabled={busy}
            className="flex-1 flex-row items-center justify-center rounded-xl border py-2.5"
            style={{ borderColor: '#FCA5A5', opacity: busy ? 0.6 : 1 }}
          >
            <Ionicons name="cash-outline" size={16} color="#DC2626" />
            <Typography variant="body-small-semibold" className="ml-1.5" style={{ color: '#DC2626' }}>
              {t('SpotAttention.dispute')}
            </Typography>
          </Pressable>
        )}
      </View>

      {isHeld && (
        <Pressable
          onPress={confirmRedispatch}
          disabled={busy}
          className="mt-2 flex-row items-center justify-center rounded-xl py-2.5"
          style={{ backgroundColor: '#EC2828', opacity: busy ? 0.6 : 1 }}
        >
          <Ionicons name="bicycle-outline" size={16} color="#fff" />
          <Typography variant="body-small-semibold" className="ml-1.5 text-white">
            {t('SpotAttention.redispatch')}
          </Typography>
        </Pressable>
      )}
    </View>
  );
}
