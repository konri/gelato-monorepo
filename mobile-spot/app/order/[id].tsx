import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { StarRating } from '@/components/atoms/StarRating';
import { CancelOrderModal } from '@/components/molecules/CancelOrderModal';
import { CollectWithoutQrModal } from '@/components/molecules/CollectWithoutQrModal';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { ReadyByRow } from '@/components/molecules/ReadyByRow';
import { OrderChat } from '@/components/organisms/OrderChat';
import { useToast } from '@/components/organisms/ToastProvider';
import { staticMapUrl } from '@/services/googlePlaces';
import { terminateOrder } from '@/hooks/useSpotOrders';
import { collectPickupOrder, getOrderById, type OrderDetail } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

// Statuses where a courier is en route → keep polling for its position.
const LIVE_STATUSES = ['COURIER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];
const WAITING_FOR_REVIEW = ['DELIVERED', 'COLLECTED'];
const FINISHED_STATUSES = ['DELIVERED', 'COLLECTED', 'CANCELLED', 'FAILED', 'TERMINATED'];

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

export default function OrderTrackScreen() {
  const { t } = useTranslation();
  const { id, messageId } = useLocalSearchParams<{ id: string; messageId?: string }>();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getOrderById(id, { token });
    setOrder(res.data ?? null);
    setLoading(false);
  }, [id]);

  // Orders that can still be terminated (not already finished).
  const canTerminate = !!order && !FINISHED_STATUSES.includes(String(order.status));
  const canCollectManually = canTerminate && order?.fulfillmentType === 'PICKUP';

  const doCollect = useCallback(async () => {
    if (!id) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await collectPickupOrder(id, { token });
    if (res.error || !res.data) {
      throw new Error(res.error?.message || t('Scan.collectError'));
    }
    const pts = res.data.pointsAwarded;
    toast.success(pts > 0 ? t('Scan.collectedWithPoints', { points: pts }) : t('Scan.collectedDone'));
    await load();
  }, [id, load, t, toast]);

  const doCancel = useCallback(async (reason: string, points: number) => {
    if (!id) return;
    const res = await terminateOrder(id, reason, points);
    if (res.error || !res.data) {
      throw new Error(res.error?.message || t('OrderTrack.terminateFailed'));
    }
    toast.success(t('CancelOrder.done'));
    await load();
  }, [id, load, t, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll every 8s while a courier is en route, or until a delivered order is reviewed.
  useEffect(() => {
    const live =
      !!order &&
      (LIVE_STATUSES.includes(order.status as string) ||
        (WAITING_FOR_REVIEW.includes(order.status as string) && !order.review));
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
  }, [order?.status, order?.review?.id, load]);

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
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={order ? t('Spot.orderNumber', { number: order.orderNumber }) : t('OrderTrack.title')}
      />

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

            {(order.status === 'TERMINATED' || order.status === 'CANCELLED') && (
              <View className="mb-4 rounded-2xl bg-red-50 p-4">
                <Typography variant="body-base-bold" style={{ color: '#B91C1C' }}>
                  {t('CancelOrder.cancelledBanner')}
                </Typography>
                {!!order.terminationReason && (
                  <Typography variant="body-small-regular" className="mt-1" style={{ color: '#B91C1C' }}>
                    {t('CancelOrder.reasonShown', { reason: order.terminationReason })}
                  </Typography>
                )}
                {!!order.apologyPoints && (
                  <Typography variant="body-small-regular" className="mt-1" style={{ color: '#B91C1C' }}>
                    {t('CancelOrder.pointsShown', { points: order.apologyPoints })}
                  </Typography>
                )}
              </View>
            )}

            <View className="mb-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <ReadyByRow scheduledFor={order.scheduledFor} />
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

            {order.invoiceRequested && (
              <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <View className="flex-row items-center">
                  <Ionicons name="document-text-outline" size={18} color="#92400E" />
                  <Typography variant="body-base-bold" className="ml-2 text-text-primary">
                    {t('Checkout.invoiceRequested')}
                  </Typography>
                </View>
                <InvoiceField label={t('Checkout.companyName')} value={order.invoiceCompanyName} />
                <InvoiceField label={t('Checkout.nip')} value={order.invoiceNIP} />
                <InvoiceField label={t('Checkout.companyAddress')} value={order.invoiceAddress} />
              </View>
            )}

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

            {order.review && (
              <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                <Typography variant="body-base-bold" className="text-text-primary">
                  {t('OrderTrack.reviewTitle')}
                </Typography>
                <View className="mt-3 flex-row items-center justify-between">
                  <Typography variant="body-small-regular" className="text-gray-600">
                    {t('OrderTrack.reviewSpot')}
                  </Typography>
                  <StarRating rating={order.review.spotRating} size={18} />
                </View>
                {order.review.courierRating != null && order.review.courierRating > 0 && (
                  <View className="mt-2 flex-row items-center justify-between">
                    <Typography variant="body-small-regular" className="text-gray-600">
                      {t('OrderTrack.reviewCourier')}
                    </Typography>
                    <StarRating rating={order.review.courierRating} size={18} />
                  </View>
                )}
                {!!order.review.comment && (
                  <View className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
                    <Typography variant="body-very-small-medium" className="text-gray-500">
                      {t('OrderTrack.reviewComment')}
                    </Typography>
                    <Typography variant="body-small-regular" className="mt-0.5 text-text-primary">
                      {order.review.comment}
                    </Typography>
                  </View>
                )}
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

            {/* Chat with the customer (spot staff can message anytime). */}
            {!!order && <OrderChat orderId={order.id} highlightId={messageId ?? null} />}

            {/* Cancel — refunds the customer, awards apology points, keeps
                their loyalty points. Only while the order is still in progress.
                Uses a modal (not Alert) so it works on web too. */}
            {canCollectManually && (
              <Pressable
                onPress={() => setCollectOpen(true)}
                className="mt-4 flex-row items-center justify-center rounded-xl py-3.5"
                style={{ backgroundColor: '#EC2828' }}
              >
                <Ionicons name="bag-check-outline" size={18} color="#fff" />
                <Typography variant="body-base-semibold" className="ml-2 text-white">
                  {t('CollectManual.button')}
                </Typography>
              </Pressable>
            )}

            {canTerminate && (
              <Pressable
                onPress={() => setCancelOpen(true)}
                className="mt-4 flex-row items-center justify-center rounded-xl border py-3.5"
                style={{ borderColor: '#DC2626' }}
              >
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Typography variant="body-base-semibold" className="ml-2" style={{ color: '#DC2626' }}>
                  {t('Spot.cancelOrder')}
                </Typography>
              </Pressable>
            )}

            <CancelOrderModal
              visible={cancelOpen}
              orderNumber={order.orderNumber}
              onClose={() => setCancelOpen(false)}
              onConfirm={doCancel}
            />

            <CollectWithoutQrModal
              visible={collectOpen}
              orderNumber={order.orderNumber}
              customerName={order.customerName}
              amountDue={order.paymentStatus !== 'paid' ? zl(order.total) : null}
              onClose={() => setCollectOpen(false)}
              onConfirm={doCollect}
            />
          </ResponsiveContainer>
        </ScrollView>
      )}
    </View>
  );
}

function InvoiceField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="mt-3">
      <Typography variant="body-very-small-medium" className="text-gray-500">
        {label}
      </Typography>
      <Typography variant="body-base-semibold" className="text-text-primary" selectable>
        {value}
      </Typography>
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
