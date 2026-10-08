import { STATUS_STYLE, trackingSteps, trackingStepIndex, isTerminal } from '@/components/ordering/orderStatus';
import { OrderReviewSection } from '@/components/ordering/OrderReviewSection';
import { OrderChat } from '@/components/ordering/OrderChat';
import { useOrderTracking } from '@/hooks/useOrders';
import { useBrandLabel } from '@/hooks/useRewards';
import { pointsText } from '@/utils/formatPoints';
import { staticMapUrl } from '@/services/googlePlaces';
import { createComplaint } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/palette';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { id, messageId } = useLocalSearchParams<{ id: string; messageId?: string }>();
  const { order, loading } = useOrderTracking(id ?? null);
  // Apology points are credited at the order's brand: name it (BRANDS_SPEC §5.6).
  const orderBrand = useBrandLabel(order?.apologyPoints ? order.brandId : null);
  const [complaintOpen, setComplaintOpen] = useState(false);

  // Scroll-to-chat when deep-linked from an order-message notification.
  const scrollRef = useRef<ScrollView>(null);
  const chatYRef = useRef<number | null>(null);
  const didScrollToChat = useRef(false);
  const maybeScrollToChat = () => {
    if (messageId && !didScrollToChat.current && chatYRef.current != null) {
      didScrollToChat.current = true;
      // Defer so layout is settled.
      setTimeout(() => scrollRef.current?.scrollTo({ y: chatYRef.current!, animated: true }), 300);
    }
  };
  useEffect(() => {
    didScrollToChat.current = false;
  }, [messageId]);

  const isPickup = order?.fulfillmentType === 'PICKUP';
  const mapUrl = useMemo(() => {
    if (!order?.spot?.latitude || !order?.spot?.longitude) return null;
    return staticMapUrl({
      spot: { latitude: order.spot.latitude, longitude: order.spot.longitude },
      // Pickup has no delivery destination/courier — just show the spot.
      destination:
        !isPickup && order.deliveryLatitude != null && order.deliveryLongitude != null
          ? { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }
          : null,
      courier:
        !isPickup && order.courierLocation
          ? { latitude: order.courierLocation.latitude, longitude: order.courierLocation.longitude }
          : null,
      width: width - 32,
      height: 200,
    });
  }, [order, width, isPickup]);

  if (loading && !order) {
    return (
      <View className="flex-1 bg-mainBg items-center justify-center">
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }
  if (!order) {
    return (
      <View className="flex-1 bg-mainBg items-center justify-center">
        <Text className="font-urbanist text-text-secondary">{t('Common.error')}</Text>
      </View>
    );
  }

  const style = STATUS_STYLE[order.status];
  const steps = trackingSteps(order.fulfillmentType);
  const currentStep = trackingStepIndex(order.status, order.fulfillmentType);
  const terminated = order.status === 'TERMINATED';
  const cancelled = order.status === 'CANCELLED' || order.status === 'FAILED' || terminated;

  return (
    <View className="flex-1 bg-mainBg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2">
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </Pressable>
        <Text className="text-lg font-urbanist-bold text-text-primary flex-1">
          {t('Ordering.orderNo', { number: order.orderNumber })}
        </Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Status banner */}
        <View className={`rounded-2xl px-4 py-3 ${style.bg} flex-row items-center`}>
          <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: style.dot }} />
          <Text className={`font-urbanist-bold ${style.text}`}>
            {t(`Ordering.status.${order.status}`)}
          </Text>
        </View>

        {/* Apology + refund note when the spot cancelled the order. */}
        {terminated && (
          <View className="mt-4 rounded-2xl bg-red-50 px-4 py-4">
            <Text className="font-urbanist-bold text-red-700 mb-1">
              {t('Ordering.terminated.title')}
            </Text>
            <Text className="font-urbanist text-red-700 leading-5">
              {t('Ordering.terminated.body')}
            </Text>
            {!!order.terminationReason && (
              <Text className="font-urbanist text-red-700 leading-5 mt-2">
                {t('Ordering.terminated.reason', { reason: order.terminationReason })}
              </Text>
            )}
            {!!order.apologyPoints && (
              <Text className="font-urbanist-semibold text-red-700 leading-5 mt-2">
                {orderBrand
                  ? t('Ordering.terminated.pointsBrand', {
                      brand: orderBrand.name,
                      pointsText: pointsText(t, order.apologyPoints),
                    })
                  : t('Ordering.terminated.points', { pointsText: pointsText(t, order.apologyPoints) })}
              </Text>
            )}
          </View>
        )}

        {/* Map (not for terminated orders — nothing to track) */}
        {terminated ? null : mapUrl ? (
          <Image
            source={{ uri: mapUrl }}
            style={{ width: '100%', height: 200, borderRadius: 16, marginTop: 16 }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-52 rounded-2xl bg-white border border-gray-200 items-center justify-center mt-4">
            <Text className="text-4xl">🗺️</Text>
          </View>
        )}

        {/* Progress steps (hidden for cancelled/failed) */}
        {!cancelled ? (
          <View className="mt-5">
            <Text className="font-urbanist-bold text-text-primary mb-3">
              {t('Ordering.tracking.steps')}
            </Text>
            {steps.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <View key={step} className="flex-row items-center mb-3">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: done ? THEME.primary : THEME.borderStrong }}
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

        {/* Spot + (delivery: destination + courier | pickup: collection note) */}
        <View className="mt-4 bg-white border border-gray-200 rounded-2xl p-4">
          <InfoRow icon="storefront" iconColor={THEME.primary} label={t('Ordering.tracking.spot')} value={order.spot?.name} />
          <View className="h-px bg-gray-200 my-3" />
          {isPickup ? (
            <InfoRow
              icon="bag-check"
              iconColor={THEME.primary}
              label={t('Ordering.tracking.collection')}
              value={order.spot?.address ?? t('Checkout.pickupHint')}
            />
          ) : (
            <>
              <InfoRow icon="location" iconColor={THEME.text} label={t('Ordering.tracking.destination')} value={order.deliveryAddress} />
              {order.status === 'IN_TRANSIT' || order.status === 'PICKED_UP' || order.status === 'COURIER_ASSIGNED' ? (
                <>
                  <View className="h-px bg-gray-200 my-3" />
                  {/* Courier identity: avatar + name (fallback to a status line). */}
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center overflow-hidden mr-3">
                      {order.courierName && (order as any).courierPhoto ? (
                        <Image source={{ uri: (order as any).courierPhoto }} style={{ width: 40, height: 40 }} />
                      ) : (
                        <Ionicons name="bicycle" size={20} color="#16A34A" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-urbanist text-text-tertiary">{t('Ordering.tracking.courier')}</Text>
                      <Text className="font-urbanist-semibold text-text-primary">
                        {order.courierName
                          ? order.courierName
                          : order.courierLocation
                            ? t('Ordering.tracking.etaLine')
                            : t('Ordering.tracking.noCourierYet')}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>

        {/* Delivery PIN — read this out to the courier so they can confirm delivery. */}
        {!isPickup &&
        order.deliveryPin &&
        (order.status === 'IN_TRANSIT' || order.status === 'PICKED_UP' || order.status === 'COURIER_ASSIGNED') ? (
          <View className="mt-4 bg-accent/5 border border-accent/20 rounded-2xl p-4 items-center">
            <Text className="text-xs font-urbanist text-text-secondary text-center">
              {t('Ordering.tracking.pinHint')}
            </Text>
            <Text className="text-3xl font-urbanist-bold tracking-[8px] text-accent mt-2">
              {order.deliveryPin}
            </Text>
          </View>
        ) : null}

        {/* Call spot */}
        {order.spot?.phone ? (
          <Pressable
            className="mt-4 flex-row items-center justify-center bg-white border border-accent rounded-2xl py-3.5"
            onPress={() => Linking.openURL(`tel:${order.spot!.phone}`)}
          >
            <Ionicons name="call" size={18} color={THEME.primary} />
            <Text className="ml-2 font-urbanist-bold text-accent">{t('Ordering.tracking.callSpot')}</Text>
          </Pressable>
        ) : null}

        {/* Summary */}
        <View className="mt-4 bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="font-urbanist-bold text-text-primary mb-2">
            {t('Ordering.tracking.summary')}
          </Text>
          <SummaryRow label={t('Checkout.subtotal')} value={zl(order.subtotal)} />
          {order.discount > 0 ? <SummaryRow label={t('Checkout.discount')} value={`−${zl(order.discount)}`} /> : null}
          {!isPickup && (
            <SummaryRow
              label={t('Checkout.delivery')}
              value={order.deliveryFee === 0 ? t('Checkout.free') : zl(order.deliveryFee)}
            />
          )}
          <View className="flex-row justify-between mt-2">
            <Text className="font-urbanist-bold text-text-primary">{t('Checkout.total')}</Text>
            <Text className="font-urbanist-bold text-text-primary">{zl(order.total)}</Text>
          </View>
        </View>

        {order.invoiceRequested ? (
          <View className="mt-4 bg-white border border-gray-200 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="document-text-outline" size={18} color={THEME.primary} />
              <Text className="ml-2 font-urbanist-bold text-text-primary">
                {t('Checkout.invoiceRequested')}
              </Text>
            </View>
            <InfoRow icon="business-outline" iconColor={THEME.text} label={t('Checkout.companyName')} value={order.invoiceCompanyName} />
            <View className="h-px bg-gray-200 my-3" />
            <InfoRow icon="card-outline" iconColor={THEME.text} label={t('Checkout.nip')} value={order.invoiceNIP} />
            {order.invoiceAddress ? (
              <>
                <View className="h-px bg-gray-200 my-3" />
                <InfoRow icon="location-outline" iconColor={THEME.text} label={t('Checkout.companyAddress')} value={order.invoiceAddress} />
              </>
            ) : null}
          </View>
        ) : null}

        {/* Rate the order (shown once delivered, hidden after reviewing). */}
        <OrderReviewSection
          orderId={order.id}
          delivered={order.status === 'DELIVERED'}
          hasCourier={!!order.courierName || !!order.courierLocation}
        />

        {/* Chat with the spot / courier */}
        <OrderChat
          orderId={order.id}
          highlightId={messageId ?? null}
          onMeasureY={(y) => {
            chatYRef.current = y;
            maybeScrollToChat();
          }}
        />

        {/* Report a problem */}
        <Pressable
          className="mt-4 flex-row items-center justify-center py-3.5"
          onPress={() => setComplaintOpen(true)}
        >
          <Ionicons name="alert-circle-outline" size={18} color={THEME.textTertiary} />
          <Text className="ml-2 font-urbanist-semibold text-text-secondary">
            {t('Complaint.report')}
          </Text>
        </Pressable>
      </ScrollView>

      {complaintOpen && order ? (
        <ComplaintModal orderId={order.id} orderNumber={order.orderNumber} onClose={() => setComplaintOpen(false)} />
      ) : null}
    </View>
  );
}

const ComplaintModal = ({
  orderId,
  orderNumber,
  onClose,
}: {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setBusy(true);
    setError(false);
    const token = (await safeGetItem('access_token')) ?? undefined;
    const res = await createComplaint(orderId, subject.trim(), message.trim(), { token });
    setBusy(false);
    if (res.error) setError(true);
    else setDone(true);
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white p-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-urbanist-bold text-lg text-text-primary">{t('Complaint.title')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={THEME.text} />
            </Pressable>
          </View>
          <Text className="font-urbanist text-text-secondary mb-4">#{orderNumber}</Text>

          {done ? (
            <View className="items-center py-4">
              <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
              <Text className="mt-3 text-center font-urbanist text-text-secondary">{t('Complaint.sent')}</Text>
              <Pressable className="mt-5 rounded-2xl px-6 py-3" style={{ backgroundColor: THEME.primary }} onPress={onClose}>
                <Text className="font-urbanist-bold text-white">{t('Common.close')}</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {error ? (
                <View className="rounded-xl bg-red-50 px-4 py-3">
                  <Text className="font-urbanist text-red-700">{t('Complaint.error')}</Text>
                </View>
              ) : null}
              <TextInput
                className="rounded-xl border border-gray-300 px-4 py-3 font-urbanist"
                placeholder={t('Complaint.subject')}
                value={subject}
                onChangeText={setSubject}
              />
              <TextInput
                className="rounded-xl border border-gray-300 px-4 py-3 font-urbanist"
                placeholder={t('Complaint.message')}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                style={{ minHeight: 96, textAlignVertical: 'top' }}
              />
              <Pressable
                className="items-center rounded-2xl py-4"
                style={{ backgroundColor: busy || !subject.trim() || !message.trim() ? THEME.primaryDisabled : THEME.primary }}
                onPress={submit}
                disabled={busy || !subject.trim() || !message.trim()}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-urbanist-bold text-white">{t('Complaint.send')}</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

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
