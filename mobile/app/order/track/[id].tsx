import { STATUS_STYLE, TRACKING_STEPS, isTerminal } from '@/components/ordering/orderStatus';
import { useOrderTracking } from '@/hooks/useOrders';
import { staticMapUrl } from '@/services/googlePlaces';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, loading } = useOrderTracking(id ?? null);

  const mapUrl = useMemo(() => {
    if (!order?.spot?.latitude || !order?.spot?.longitude) return null;
    return staticMapUrl({
      spot: { latitude: order.spot.latitude, longitude: order.spot.longitude },
      destination: { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
      courier: order.courierLocation
        ? { latitude: order.courierLocation.latitude, longitude: order.courierLocation.longitude }
        : null,
      width: width - 32,
      height: 200,
    });
  }, [order, width]);

  if (loading && !order) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }
  if (!order) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="font-urbanist text-text-secondary">{t('Common.error')}</Text>
      </View>
    );
  }

  const style = STATUS_STYLE[order.status];
  const currentStep = TRACKING_STEPS.indexOf(order.status);
  const cancelled = order.status === 'CANCELLED' || order.status === 'FAILED';

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="text-lg font-urbanist-bold text-text-primary flex-1">
          {t('Ordering.orderNo', { number: order.orderNumber })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Status banner */}
        <View className={`rounded-2xl px-4 py-3 ${style.bg} flex-row items-center`}>
          <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: style.dot }} />
          <Text className={`font-urbanist-bold ${style.text}`}>
            {t(`Ordering.status.${order.status}`)}
          </Text>
        </View>

        {/* Map */}
        {mapUrl ? (
          <Image
            source={{ uri: mapUrl }}
            style={{ width: '100%', height: 200, borderRadius: 16, marginTop: 16 }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-52 rounded-2xl bg-background-secondary items-center justify-center mt-4">
            <Text className="text-4xl">🗺️</Text>
          </View>
        )}

        {/* Progress steps (hidden for cancelled/failed) */}
        {!cancelled ? (
          <View className="mt-5">
            <Text className="font-urbanist-bold text-text-primary mb-3">
              {t('Ordering.tracking.steps')}
            </Text>
            {TRACKING_STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <View key={step} className="flex-row items-center mb-3">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: done ? '#EC2828' : '#E5E7EB' }}
                  >
                    {done ? <Ionicons name="checkmark" size={14} color="white" /> : null}
                  </View>
                  <Text
                    className={`font-urbanist ${active ? 'font-urbanist-bold text-text-primary' : done ? 'text-text-primary' : 'text-text-tertiary'}`}
                  >
                    {t(`Ordering.status.${step}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Spot + destination + courier */}
        <View className="mt-4 bg-background-secondary rounded-2xl p-4">
          <InfoRow icon="storefront" iconColor="#EC2828" label={t('Ordering.tracking.spot')} value={order.spot?.name} />
          <View className="h-px bg-gray-200 my-3" />
          <InfoRow icon="location" iconColor="#212121" label={t('Ordering.tracking.destination')} value={order.deliveryAddress} />
          {order.status === 'IN_TRANSIT' || order.status === 'PICKED_UP' || order.status === 'COURIER_ASSIGNED' ? (
            <>
              <View className="h-px bg-gray-200 my-3" />
              <InfoRow
                icon="bicycle"
                iconColor="#16A34A"
                label={t('Ordering.tracking.courier')}
                value={order.courierLocation ? t('Ordering.tracking.etaLine') : t('Ordering.tracking.noCourierYet')}
              />
            </>
          ) : null}
        </View>

        {/* Call spot */}
        {order.spot?.phone ? (
          <Pressable
            className="mt-4 flex-row items-center justify-center bg-white border border-accent rounded-2xl py-3.5"
            onPress={() => Linking.openURL(`tel:${order.spot!.phone}`)}
          >
            <Ionicons name="call" size={18} color="#EC2828" />
            <Text className="ml-2 font-urbanist-bold text-accent">{t('Ordering.tracking.callSpot')}</Text>
          </Pressable>
        ) : null}

        {/* Summary */}
        <View className="mt-4 bg-background-secondary rounded-2xl p-4">
          <Text className="font-urbanist-bold text-text-primary mb-2">
            {t('Ordering.tracking.summary')}
          </Text>
          <SummaryRow label={t('Checkout.subtotal')} value={zl(order.subtotal)} />
          {order.discount > 0 ? <SummaryRow label={t('Checkout.discount')} value={`−${zl(order.discount)}`} /> : null}
          <SummaryRow
            label={t('Checkout.delivery')}
            value={order.deliveryFee === 0 ? t('Checkout.free') : zl(order.deliveryFee)}
          />
          <View className="flex-row justify-between mt-2">
            <Text className="font-urbanist-bold text-text-primary">{t('Checkout.total')}</Text>
            <Text className="font-urbanist-bold text-text-primary">{zl(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const InfoRow = ({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: any;
  iconColor: string;
  label: string;
  value?: string | null;
}) => (
  <View className="flex-row items-start">
    <Ionicons name={icon} size={18} color={iconColor} style={{ marginTop: 2 }} />
    <View className="ml-3 flex-1">
      <Text className="text-xs font-urbanist text-text-tertiary">{label}</Text>
      <Text className="font-urbanist-semibold text-text-primary">{value ?? '—'}</Text>
    </View>
  </View>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-0.5">
    <Text className="font-urbanist text-text-secondary">{label}</Text>
    <Text className="font-urbanist-bold text-text-primary">{value}</Text>
  </View>
);
