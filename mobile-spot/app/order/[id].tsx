import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { staticMapUrl } from '@/services/googlePlaces';
import { getOrderById, terminateOrder, type OrderDetail } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Statuses where a courier is en route → keep polling for its position.
const LIVE_STATUSES = ['COURIER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];

export default function OrderTrackScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getOrderById(id, { token });
    setOrder(res.data ?? null);
    setLoading(false);
  }, [id]);

  // Orders that can still be terminated (not already finished).
  const canTerminate =
    !!order &&
    !['DELIVERED', 'COLLECTED', 'CANCELLED', 'FAILED', 'TERMINATED'].includes(String(order.status));

  const doTerminate = useCallback(async () => {
    if (!id) return;
    setTerminating(true);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res = await terminateOrder(id, undefined, { token });
      if (res.error) throw new Error(res.error.message);
      await load();
    } catch (e) {
      Alert.alert(t('OrderTrack.terminateFailed'), e instanceof Error ? e.message : '');
    } finally {
      setTerminating(false);
    }
  }, [id, load, t]);

  const confirmTerminate = useCallback(() => {
    Alert.alert(t('OrderTrack.terminateTitle'), t('OrderTrack.terminateConfirm'), [
      { text: t('OrderTrack.terminateCancel'), style: 'cancel' },
      { text: t('OrderTrack.terminateConfirmCta'), style: 'destructive', onPress: () => void doTerminate() },
    ]);
  }, [t, doTerminate]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll every 8s while a courier is en route.
  useEffect(() => {
    const live = order && LIVE_STATUSES.includes(order.status as string);
    if (live && !pollRef.current) {
      pollRef.current = setInterval(() => void load(), 8000);
    }
    if (!live && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [order?.status, load]);

  const mapWidth = Math.min(width - 32, 640);
  const spotLat = order?.spot?.latitude;
  const spotLng = order?.spot?.longitude;
  const map =
    order && spotLat != null && spotLng != null && order.deliveryLatitude
      ? staticMapUrl({
          spot: { latitude: spotLat, longitude: spotLng },
          destination: { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
          courier: order.courierLocation
            ? { latitude: order.courierLocation.latitude, longitude: order.courierLocation.longitude }
            : null,
          width: mapWidth,
          height: 220,
        })
      : null;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-4">
        <Pressable onPress={() => goBackOr()} hitSlop={8} className="pr-2">
          <Ionicons name="arrow-back" size={22} color="#212121" />
        </Pressable>
        <Typography variant="body-lg-bold" className="text-text-primary">
          {order ? t('Spot.orderNumber', { number: order.orderNumber }) : t('OrderTrack.title')}
        </Typography>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#EC2828" />
        </View>
      ) : !order ? (
        <View className="flex-1 items-center justify-center px-8">
          <Typography variant="body-base-regular" className="text-gray-500">
            {t('OrderTrack.notFound')}
          </Typography>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <ResponsiveContainer maxWidth={680}>
            {/* Status */}
            <View className="mb-4 self-start rounded-full bg-white px-4 py-2 shadow-sm">
              <Typography variant="body-small-bold" style={{ color: '#EC2828' }}>
                {t(`OrderStatus.${order.status}`, { defaultValue: String(order.status) })}
              </Typography>
            </View>

            {/* Map */}
            {map ? (
              <Image
                source={{ uri: map }}
                style={{ width: '100%', height: 220, borderRadius: 16, backgroundColor: '#E5E7EB' }}
                resizeMode="cover"
              />
            ) : (
              <View className="h-32 items-center justify-center rounded-2xl bg-gray-100">
                <Ionicons name="map-outline" size={32} color="#9CA3AF" />
                <Typography variant="body-small-regular" className="mt-2 text-gray-400">
                  {t('OrderTrack.noMap')}
                </Typography>
              </View>
            )}

            {/* From → to */}
            <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <Row icon="storefront" color="#EC2828" label={order.spot?.name ?? '—'} sub={order.spot?.address} />
              <View className="my-2 ml-2 h-4 w-px bg-gray-200" />
              <Row icon="location" color="#212121" label={order.deliveryAddress} />
              {order.courierLocation && (
                <>
                  <View className="my-2 ml-2 h-4 w-px bg-gray-200" />
                  <Row icon="bicycle" color="#16A34A" label={t('OrderTrack.courierEnRoute')} />
                </>
              )}
            </View>

            {/* Assigned courier — name + photo. */}
            {order.courierName && (
              <View className="mt-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
                <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                  {order.courierPhoto ? (
                    <Image source={{ uri: order.courierPhoto }} style={{ width: 44, height: 44 }} />
                  ) : (
                    <Ionicons name="bicycle" size={22} color="#16A34A" />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Typography variant="body-very-small-medium" className="text-gray-500">
                    {t('OrderTrack.courier')}
                  </Typography>
                  <Typography variant="body-base-semibold" className="text-text-primary">
                    {order.courierName}
                  </Typography>
                </View>
              </View>
            )}

            {/* Pickup code — read this out to the courier to confirm handover. */}
            {order.pickupCode &&
            ['READY', 'COURIER_ASSIGNED'].includes(String(order.status)) ? (
              <View className="mt-4 items-center rounded-2xl border p-4" style={{ borderColor: 'rgba(236,40,40,0.2)', backgroundColor: 'rgba(236,40,40,0.05)' }}>
                <Typography variant="body-small-regular" className="text-center text-gray-600">
                  {t('OrderTrack.pickupCodeHint')}
                </Typography>
                <Typography variant="heading-32-bold" className="mt-2" style={{ letterSpacing: 8, color: '#EC2828' }}>
                  {order.pickupCode}
                </Typography>
              </View>
            ) : null}

            {/* Call the courier once one is assigned (calling the spot itself is
                pointless — we ARE the spot). Falls back to nothing if the
                courier has no phone on file. */}
            {order.courierPhone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${order.courierPhone}`)}
                className="mt-4 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3.5"
              >
                <Ionicons name="call" size={18} color="#EC2828" />
                <Typography variant="body-base-semibold" className="ml-2" style={{ color: '#EC2828' }}>
                  {t('OrderTrack.callCourier')}
                </Typography>
              </Pressable>
            )}

            {/* Terminate — refunds the customer, keeps their points. Only while
                the order is still in progress. */}
            {canTerminate && (
              <Pressable
                onPress={confirmTerminate}
                disabled={terminating}
                className="mt-4 flex-row items-center justify-center rounded-xl border py-3.5"
                style={{ borderColor: '#DC2626' }}
              >
                {terminating ? (
                  <ActivityIndicator color="#DC2626" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                    <Typography variant="body-base-semibold" className="ml-2" style={{ color: '#DC2626' }}>
                      {t('OrderTrack.terminate')}
                    </Typography>
                  </>
                )}
              </Pressable>
            )}
          </ResponsiveContainer>
        </ScrollView>
      )}
    </View>
  );
}

function Row({
  icon,
  color,
  label,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  sub?: string | null;
}) {
  return (
    <View className="flex-row items-start">
      <Ionicons name={icon} size={18} color={color} style={{ marginTop: 2 }} />
      <View className="ml-3 flex-1">
        <Typography variant="body-base-semibold" className="text-text-primary">
          {label}
        </Typography>
        {sub ? (
          <Typography variant="body-small-regular" className="text-gray-500">
            {sub}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}
