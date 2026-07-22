import { useCart } from '@/hooks/useCart';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { createOrder, createPaymentIntent, confirmOrderPayment, CreateOrderInput } from '@repo/api-client';
import { useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cart = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const isPickup = cart.fulfillmentType === 'pickup';
  const [processing, setProcessing] = useState(false);
  // Pay online (Stripe) now, or pay in cash at the spot. Cash is pickup-only.
  const [payChoice, setPayChoice] = useState<'online' | 'cash'>('online');
  const cash = isPickup && payChoice === 'cash';

  const discount = cart.form?.promo?.discountAmount ?? 0;
  const freeThreshold = cart.delivery?.freeDeliveryThreshold ?? null;
  const baseFee = cart.delivery?.deliveryFee ?? 0;
  const deliveryFee = isPickup ? 0 : freeThreshold != null && cart.subtotal >= freeThreshold ? 0 : baseFee;
  const total = Math.max(0, cart.subtotal - discount) + deliveryFee;

  const buildInput = (): CreateOrderInput | null => {
    if (!cart.spotId || cart.items.length === 0) return null;
    // Delivery orders need a validated address; pickup orders don't.
    if (!isPickup && !cart.delivery) return null;
    const f = cart.form;
    const items = cart.items.map((i) => {
      if (i.kind === 'taste') return { tasteId: i.refId, quantity: i.quantity };
      // Expand box selections (title+qty) into a flat list of taste ids.
      const boxTasteIds = i.boxSelections?.flatMap((s) =>
        Array.from({ length: s.quantity }, () => s.tasteId),
      );
      return {
        productId: i.refId,
        quantity: i.quantity,
        ...(boxTasteIds && boxTasteIds.length ? { boxTasteIds } : {}),
      };
    });
    return {
      spotId: cart.spotId,
      items,
      fulfillmentType: isPickup ? 'PICKUP' : 'DELIVERY',
      // cash = pay at spot; otherwise pay online now via Stripe.
      paymentMethod: cash ? 'cash' : 'card',
      // Address only applies to delivery.
      ...(isPickup
        ? {}
        : {
            deliveryAddress: cart.delivery!.address,
            deliveryLatitude: cart.delivery!.latitude,
            deliveryLongitude: cart.delivery!.longitude,
            buildingType: f?.buildingType,
            apartmentNumber: f?.apartmentNumber || undefined,
            floor: f?.floor || undefined,
            deliveryNotes: f?.noteForCourier || undefined,
          }),
      spotNotes: f?.noteForSpot || undefined,
      scheduledFor: f?.scheduledForIso || undefined,
      promoCode: f?.promo?.code,
      invoiceRequested: f?.invoiceRequested,
      invoiceNIP: f?.invoiceNIP || undefined,
      invoiceCompanyName: f?.invoiceCompanyName || undefined,
      invoiceAddress: f?.invoiceAddress || undefined,
    };
  };

  const goToSuccess = (order: { orderNumber: string; id: string }) => {
    cart.clear();
    router.replace(
      `/order/success?orderNumber=${encodeURIComponent(order.orderNumber)}&orderId=${order.id}${
        cash ? '&cash=1' : ''
      }`,
    );
  };

  const pay = async () => {
    const input = buildInput();
    if (!input) {
      Alert.alert(t('Payment.title'), t('Payment.incomplete'));
      return;
    }
    setProcessing(true);
    try {
      const token = await safeGetItem('access_token');
      const auth = { token: token ?? undefined };

      // 1. Create the order (server recomputes prices + promo).
      const orderRes = await createOrder(input, auth);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error?.message || t('Payment.orderFailed'));
      }
      const order = orderRes.data;

      // Pay-at-spot (cash): no online payment — order is settled on collection.
      if (cash) {
        goToSuccess(order);
        return;
      }

      // 2. Create a Stripe PaymentIntent for it.
      const piRes = await createPaymentIntent(order.id, auth);
      if (!piRes.success || !piRes.data) {
        throw new Error(piRes.error?.message || t('Payment.paymentFailed'));
      }
      const clientSecret = piRes.data;

      // 3. Present the PaymentSheet (card / Apple Pay / Google Pay / BLIK).
      const initRes = await initPaymentSheet({
        merchantDisplayName: 'Gelato',
        paymentIntentClientSecret: clientSecret,
        applePay: { merchantCountryCode: 'PL' },
        googlePay: { merchantCountryCode: 'PL', currencyCode: 'PLN', testEnv: true },
        allowsDelayedPaymentMethods: true,
        returnURL: 'gelato://order/success',
      });
      if (initRes.error) throw new Error(initRes.error.message);

      const { error } = await presentPaymentSheet();
      if (error) {
        // User cancelled or payment failed — keep them on this screen.
        if (error.code !== 'Canceled') {
          Alert.alert(t('Payment.paymentFailed'), error.message);
        }
        return;
      }

      // 4. Confirm server-side so the order is committed + sent to the spot
      // immediately (don't wait on the Stripe webhook, which may not reach us
      // in dev). Best-effort: if this fails the webhook is still the backstop.
      await confirmOrderPayment(order.id, auth).catch(() => {});

      // 5. Success — clear cart, go to confetti screen.
      goToSuccess(order);
    } catch (e) {
      Alert.alert(t('Payment.paymentFailed'), (e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2" disabled={processing}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="text-lg font-urbanist-bold text-text-primary flex-1">
          {t('Payment.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-background-secondary rounded-2xl p-4">
          <Text className="font-urbanist-bold text-text-primary mb-2">{t('Checkout.summary')}</Text>
          <View className="flex-row items-start">
            <Ionicons
              name={isPickup ? 'storefront' : 'location'}
              size={16}
              color="#EC2828"
              style={{ marginTop: 2 }}
            />
            <Text className="ml-2 flex-1 font-urbanist text-text-secondary">
              {isPickup ? t('Checkout.pickupAtSpot') : cart.delivery?.address}
            </Text>
          </View>
          <Text className="font-urbanist text-text-secondary mt-1">
            🕒 {cart.form?.scheduledLabel ?? t('Checkout.asap')}
          </Text>

          <View className="h-px bg-gray-200 my-3" />
          <SummaryRow label={t('Checkout.subtotal')} value={zl(cart.subtotal)} />
          {discount > 0 ? (
            <SummaryRow label={t('Checkout.discount')} value={`−${zl(discount)}`} />
          ) : null}
          {!isPickup && (
            <SummaryRow
              label={t('Checkout.delivery')}
              value={deliveryFee === 0 ? t('Checkout.free') : zl(deliveryFee)}
            />
          )}
          <View className="flex-row justify-between mt-2">
            <Text className="font-urbanist-bold text-text-primary text-lg">{t('Checkout.total')}</Text>
            <Text className="font-urbanist-bold text-text-primary text-lg">{zl(total)}</Text>
          </View>
        </View>

        {/* Payment method: pickup can choose pay-now or pay-at-spot; delivery pays now. */}
        {isPickup ? (
          <View className="mt-6">
            <Text className="font-urbanist-bold text-text-primary mb-2">
              {t('Payment.howToPay')}
            </Text>
            <PayOption
              icon="card-outline"
              title={t('Payment.payOnline')}
              subtitle={t('Payment.payOnlineHint')}
              active={payChoice === 'online'}
              onPress={() => setPayChoice('online')}
            />
            <PayOption
              icon="cash-outline"
              title={t('Payment.payAtSpot')}
              subtitle={t('Payment.payAtSpotHint')}
              active={payChoice === 'cash'}
              onPress={() => setPayChoice('cash')}
            />
          </View>
        ) : (
          <>
            <View className="mt-6 flex-row items-center flex-wrap justify-center">
              <PayBadge icon="card-outline" label={t('Payment.card')} />
              <PayBadge icon="logo-apple" label="Apple Pay" />
              <PayBadge icon="logo-google" label="Google Pay" />
              <PayBadge icon="cash-outline" label="BLIK" />
            </View>
            <Text className="font-urbanist text-text-tertiary text-center text-xs mt-2">
              {t('Payment.securedByStripe')}
            </Text>
          </>
        )}
      </ScrollView>

      <View className="border-t border-gray-200 px-6 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable
          disabled={processing}
          className={`rounded-2xl py-4 items-center ${processing ? 'bg-gray-300' : 'bg-accent'}`}
          onPress={pay}
        >
          {processing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-urbanist-bold text-base">
              {cash ? t('Payment.placeOrder') : t('Payment.payNow')} · {zl(total)}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-0.5">
    <Text className="font-urbanist text-text-secondary">{label}</Text>
    <Text className="font-urbanist-bold text-text-primary">{value}</Text>
  </View>
);

const PayBadge = ({ icon, label }: { icon: any; label: string }) => (
  <View className="flex-row items-center bg-background-secondary rounded-full px-3 py-2 mr-2 mb-2">
    <Ionicons name={icon} size={16} color="#212121" />
    <Text className="ml-1.5 font-urbanist-semibold text-text-primary text-xs">{label}</Text>
  </View>
);

const PayOption = ({
  icon,
  title,
  subtitle,
  active,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center rounded-2xl border px-4 py-3 mb-3 ${
      active ? 'border-accent bg-accent/5' : 'border-gray-200'
    }`}
  >
    <Ionicons name={icon} size={22} color={active ? '#EC2828' : '#6B7280'} />
    <View className="flex-1 ml-3">
      <Text className="font-urbanist-bold text-text-primary">{title}</Text>
      <Text className="font-urbanist text-text-tertiary text-xs mt-0.5">{subtitle}</Text>
    </View>
    <Ionicons
      name={active ? 'radio-button-on' : 'radio-button-off'}
      size={20}
      color={active ? '#EC2828' : '#9CA3AF'}
    />
  </Pressable>
);
