import { useCart } from '@/hooks/useCart';
import { buildTimeSlots, TimeSlot } from '@/hooks/useOrdering';
import { useSpotDetail } from '@/hooks/useTastes';
import { validatePromoCode } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

export default function OrderDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cart = useCart();
  const { data: spot } = useSpotDetail(cart.spotId);

  const [buildingType, setBuildingType] = useState<'house' | 'apartment'>('apartment');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [noteForCourier, setNoteForCourier] = useState('');
  const [noteForSpot, setNoteForSpot] = useState('');

  // Delivery time
  const [slot, setSlot] = useState<TimeSlot | null>(null); // null = ASAP
  const [dayOffset, setDayOffset] = useState(0); // 0 today, 1 tomorrow

  // Promo
  const [promoInput, setPromoInput] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Invoice
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [invoiceNIP, setInvoiceNIP] = useState('');
  const [invoiceCompanyName, setInvoiceCompanyName] = useState('');
  const [invoiceAddress, setInvoiceAddress] = useState('');

  const subtotal = cart.subtotal;
  const promo = cart.form?.promo ?? null;
  const discount = promo?.discountAmount ?? 0;

  // Delivery fee: spot fee, waived over free-delivery threshold.
  const baseFee = cart.delivery?.deliveryFee ?? spot?.deliveryFee ?? 0;
  const freeThreshold = cart.delivery?.freeDeliveryThreshold ?? spot?.freeDeliveryThreshold ?? null;
  const deliveryFee = freeThreshold != null && subtotal >= freeThreshold ? 0 : baseFee;
  const amountToFree = freeThreshold != null ? Math.max(0, freeThreshold - subtotal) : 0;

  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const now = useMemo(() => new Date(), []);
  const dayDate = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [now, dayOffset]);
  const slots = useMemo(
    () => buildTimeSlots(spot?.openingHours, dayDate, now),
    [spot?.openingHours, dayDate, now],
  );

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const token = await safeGetItem('access_token');
      const res = await validatePromoCode(code, subtotal, { token: token ?? undefined });
      if (res.success && res.data?.valid) {
        cart.setForm({
          ...currentForm(),
          promo: {
            code: res.data.code,
            discountAmount: res.data.discountAmount,
            isInfluencer: res.data.isInfluencer,
          },
        });
        setPromoInput('');
      } else {
        const reason = res.data?.reason ?? 'invalid';
        setPromoError(t(`Checkout.promoError.${reason}`, { defaultValue: t('Checkout.promoInvalid') }));
      }
    } finally {
      setPromoChecking(false);
    }
  };

  const removePromo = () => cart.setForm({ ...currentForm(), promo: null });

  // Snapshot the current form fields into a draft object.
  const currentForm = () => ({
    buildingType,
    apartmentNumber,
    floor,
    scheduledForIso: slot?.startIso ?? null,
    scheduledLabel: slot ? `${dayLabel(dayOffset, t)} ${slot.label}` : null,
    noteForCourier,
    noteForSpot,
    invoiceRequested,
    invoiceNIP,
    invoiceCompanyName,
    invoiceAddress,
    promo,
  });

  const canContinue =
    !!cart.delivery &&
    (buildingType === 'house' || apartmentNumber.trim().length > 0) &&
    (!invoiceRequested || (invoiceNIP.trim() && invoiceCompanyName.trim()));

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="text-lg font-urbanist-bold text-text-primary flex-1">
          {t('Checkout.title')}
        </Text>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
        {/* Delivery address (with change) */}
        <Section title={t('Checkout.deliveryAddress')}>
          <View className="flex-row items-start">
            <Ionicons name="location" size={18} color="#EC2828" style={{ marginTop: 2 }} />
            <Text className="flex-1 ml-2 font-urbanist text-text-primary">
              {cart.delivery?.address ?? '—'}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="font-urbanist-bold text-accent">{t('Checkout.change')}</Text>
            </Pressable>
          </View>
        </Section>

        {/* Building type / apartment / floor */}
        <Section title={t('Checkout.building')}>
          <View className="flex-row mb-3">
            <TypeChip
              label={t('Checkout.apartment')}
              active={buildingType === 'apartment'}
              onPress={() => setBuildingType('apartment')}
            />
            <TypeChip
              label={t('Checkout.house')}
              active={buildingType === 'house'}
              onPress={() => setBuildingType('house')}
            />
          </View>
          {buildingType === 'apartment' ? (
            <View className="flex-row">
              <Field
                className="flex-1 mr-2"
                placeholder={t('Checkout.apartmentNumber')}
                value={apartmentNumber}
                onChangeText={setApartmentNumber}
              />
              <Field
                className="flex-1 ml-2"
                placeholder={t('Checkout.floor')}
                value={floor}
                onChangeText={setFloor}
                keyboardType="number-pad"
              />
            </View>
          ) : null}
        </Section>

        {/* Delivery time */}
        <Section title={t('Checkout.deliveryTime')}>
          <Pressable
            className={`flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 border ${
              slot === null ? 'border-accent bg-accent/5' : 'border-gray-200'
            }`}
            onPress={() => setSlot(null)}
          >
            <Text className="font-urbanist-semibold text-text-primary">{t('Checkout.asap')}</Text>
            {slot === null ? <Ionicons name="checkmark-circle" size={20} color="#EC2828" /> : null}
          </Pressable>

          <View className="flex-row mb-2">
            <TypeChip label={t('Checkout.today')} active={dayOffset === 0} onPress={() => setDayOffset(0)} />
            <TypeChip label={t('Checkout.tomorrow')} active={dayOffset === 1} onPress={() => setDayOffset(1)} />
          </View>
          <View className="flex-row flex-wrap">
            {slots.length === 0 ? (
              <Text className="font-urbanist text-text-secondary">{t('Checkout.noSlots')}</Text>
            ) : (
              slots.map((s) => {
                const active = slot?.startIso === s.startIso;
                return (
                  <Pressable
                    key={s.startIso}
                    className={`rounded-full px-4 py-2 mr-2 mb-2 border ${
                      active ? 'border-accent bg-accent' : 'border-gray-200'
                    }`}
                    onPress={() => setSlot(s)}
                  >
                    <Text className={`font-urbanist-semibold ${active ? 'text-white' : 'text-text-primary'}`}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </Section>

        {/* Promo code */}
        <Section title={t('Checkout.promoCode')}>
          {promo ? (
            <View className="flex-row items-center justify-between bg-green-50 rounded-xl px-4 py-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="pricetag" size={18} color="#16A34A" />
                <Text className="ml-2 font-urbanist-bold text-green-700">
                  {promo.code} {promo.isInfluencer ? '★' : ''}
                </Text>
                <Text className="ml-2 font-urbanist text-green-700">−{zl(promo.discountAmount)}</Text>
              </View>
              <Pressable onPress={removePromo} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#16A34A" />
              </Pressable>
            </View>
          ) : (
            <View>
              <View className="flex-row">
                <Field
                  className="flex-1 mr-2"
                  placeholder={t('Checkout.promoPlaceholder')}
                  value={promoInput}
                  onChangeText={(v) => {
                    setPromoInput(v);
                    setPromoError(null);
                  }}
                  autoCapitalize="characters"
                />
                <Pressable
                  className="bg-accent rounded-xl px-5 items-center justify-center"
                  onPress={applyPromo}
                  disabled={promoChecking}
                >
                  {promoChecking ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-urbanist-bold">{t('Checkout.apply')}</Text>
                  )}
                </Pressable>
              </View>
              {promoError ? (
                <Text className="text-xs font-urbanist text-accent mt-1">{promoError}</Text>
              ) : null}
            </View>
          )}
        </Section>

        {/* Price summary */}
        <Section title={t('Checkout.summary')}>
          <Row label={t('Checkout.subtotal')} value={zl(subtotal)} />
          {discount > 0 ? (
            <Row label={t('Checkout.discount')} value={`−${zl(discount)}`} highlight />
          ) : null}
          <Row
            label={t('Checkout.delivery')}
            value={deliveryFee === 0 ? t('Checkout.free') : zl(deliveryFee)}
          />
          {amountToFree > 0 ? (
            <Text className="text-xs font-urbanist text-accent mt-1">
              {t('Checkout.addForFree', { amount: zl(amountToFree) })}
            </Text>
          ) : null}
          <View className="h-px bg-gray-200 my-2" />
          <Row label={t('Checkout.total')} value={zl(total)} bold />
        </Section>

        {/* Invoice */}
        <Section title={t('Checkout.invoice')}>
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setInvoiceRequested((v) => !v)}
          >
            <Text className="font-urbanist text-text-primary">{t('Checkout.wantInvoice')}</Text>
            <View
              className={`w-12 h-7 rounded-full px-1 justify-center ${
                invoiceRequested ? 'bg-accent items-end' : 'bg-gray-300 items-start'
              }`}
            >
              <View className="w-5 h-5 rounded-full bg-white" />
            </View>
          </Pressable>
          {invoiceRequested ? (
            <View className="mt-3">
              <Field className="mb-2" placeholder={t('Checkout.nip')} value={invoiceNIP} onChangeText={setInvoiceNIP} keyboardType="number-pad" />
              <Field className="mb-2" placeholder={t('Checkout.companyName')} value={invoiceCompanyName} onChangeText={setInvoiceCompanyName} />
              <Field placeholder={t('Checkout.companyAddress')} value={invoiceAddress} onChangeText={setInvoiceAddress} />
            </View>
          ) : null}
        </Section>

        {/* Notes */}
        <Section title={t('Checkout.notes')}>
          <Field
            className="mb-3"
            placeholder={t('Checkout.noteCourier')}
            value={noteForCourier}
            onChangeText={setNoteForCourier}
            multiline
          />
          <Field
            placeholder={t('Checkout.noteSpot')}
            value={noteForSpot}
            onChangeText={setNoteForSpot}
            multiline
          />
        </Section>
      </ScrollView>

      {/* Continue to payment */}
      <View className="border-t border-gray-200 px-6 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable
          disabled={!canContinue}
          className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-accent' : 'bg-gray-200'}`}
          onPress={() => {
            cart.setForm(currentForm());
            router.push('/order/payment');
          }}
        >
          <Text className={`font-urbanist-bold text-base ${canContinue ? 'text-white' : 'text-text-tertiary'}`}>
            {t('Checkout.toPayment')} · {zl(total)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- small building blocks ---------- */

const dayLabel = (offset: number, t: (k: string) => string) =>
  offset === 0 ? t('Checkout.today') : t('Checkout.tomorrow');

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-5">
    <Text className="font-urbanist-bold text-text-primary mb-2">{title}</Text>
    {children}
  </View>
);

const Row = ({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) => (
  <View className="flex-row justify-between py-0.5">
    <Text className={`font-urbanist ${bold ? 'text-text-primary font-urbanist-bold text-lg' : 'text-text-secondary'}`}>
      {label}
    </Text>
    <Text
      className={`font-urbanist-bold ${
        bold ? 'text-text-primary text-lg' : highlight ? 'text-green-700' : 'text-text-primary'
      }`}
    >
      {value}
    </Text>
  </View>
);

const TypeChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    className={`rounded-full px-4 py-2 mr-2 border ${active ? 'border-accent bg-accent' : 'border-gray-200'}`}
    onPress={onPress}
  >
    <Text className={`font-urbanist-semibold ${active ? 'text-white' : 'text-text-primary'}`}>{label}</Text>
  </Pressable>
);

const Field = ({
  className,
  ...props
}: React.ComponentProps<typeof TextInput> & { className?: string }) => (
  <View className={`bg-background-secondary rounded-xl px-4 py-3 ${className ?? ''}`}>
    <TextInput
      style={{ fontFamily: 'Urbanist', fontSize: 15 }}
      placeholderTextColor="#9E9E9E"
      className="text-text-primary"
      {...props}
    />
  </View>
);
