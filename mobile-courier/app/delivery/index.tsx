import { Typography } from '@/components/atoms/Typography';
import { DeliveryMap } from '@/components/molecules/DeliveryMap';
import { useMyActiveDelivery } from '@/hooks/useCourierApplications';
import { useCourierLocationPing } from '@/hooks/useCourierLocationPing';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { openNavigation } from '@/utils/mapsNavigation';
import {
  updateDeliveryStatus,
  reportDeliveryIncident,
  uploadDeliveryIncidentPhoto,
} from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ActiveDeliveryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: delivery, loading, refetch } = useMyActiveDelivery();
  const { location } = useCurrentLocation();
  const [busy, setBusy] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);

  // Ping GPS every 60s while a delivery is active.
  useCourierLocationPing(delivery?.id ?? null);

  if (loading && !delivery) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="#EC2828" />
      </View>
    );
  }

  if (!delivery) {
    // No active delivery — bounce back home.
    return (
      <View
        className="flex-1 bg-gray-50 items-center justify-center px-8"
        style={{ paddingTop: insets.top }}
      >
        <Ionicons name="checkmark-done-circle-outline" size={56} color="#22C55E" />
        <Typography variant="body-lg-bold" className="text-text-primary mt-4">
          {t('Courier.deliveredTitle')}
        </Typography>
        <Typography
          variant="body-base-regular"
          className="text-gray-500 text-center mt-2"
        >
          {t('Courier.deliveredBody')}
        </Typography>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          className="mt-6 rounded-2xl px-6 py-3"
          style={{ backgroundColor: '#EC2828' }}
        >
          <Typography variant="body-base-semibold" className="text-white">
            {t('Courier.back')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  // Before pickup → head to spot; after pickup → head to customer.
  const pickedUp = delivery.status !== 'COURIER_ASSIGNED';
  const hasCustomer =
    delivery.deliveryLatitude != null && delivery.deliveryLongitude != null;

  const target = pickedUp && hasCustomer
    ? {
        latitude: delivery.deliveryLatitude!,
        longitude: delivery.deliveryLongitude!,
        label: delivery.deliveryAddress ?? undefined,
      }
    : {
        latitude: delivery.spotLatitude,
        longitude: delivery.spotLongitude,
        label: delivery.spotName,
      };

  // Which handover code the courier must enter next (null = no modal open).
  const [codePrompt, setCodePrompt] = useState<null | 'PICKED_UP' | 'DELIVERED'>(null);

  const advance = async (next: 'PICKED_UP' | 'DELIVERED', code?: string) => {
    setBusy(true);
    try {
      const res = await updateDeliveryStatus(delivery.id, next, { code });
      if (res.error) {
        // Surface wrong-code errors inline in the modal instead of an alert.
        throw new Error(res.error.message);
      }
      setCodePrompt(null);
      if (next === 'DELIVERED') {
        Alert.alert(t('Courier.deliveredTitle'), t('Courier.deliveredBody'));
        router.replace('/(tabs)');
        return;
      }
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
        <Pressable onPress={() => router.replace('/(tabs)')} className="p-1 mr-2">
          <Ionicons name="chevron-back" size={26} color="#212121" />
        </Pressable>
        <View>
          <Typography variant="body-lg-bold" className="text-text-primary">
            {t('Courier.activeDelivery')}
          </Typography>
          <Typography variant="body-small-regular" className="text-gray-500">
            {t('Courier.orderNumber', { number: delivery.orderNumber })}
          </Typography>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Map */}
        <DeliveryMap
          spot={{ latitude: delivery.spotLatitude, longitude: delivery.spotLongitude }}
          courier={location}
          customer={
            pickedUp && hasCustomer
              ? {
                  latitude: delivery.deliveryLatitude!,
                  longitude: delivery.deliveryLongitude!,
                }
              : null
          }
        />

        {/* Current step */}
        <View className="bg-white rounded-2xl p-4 mt-4 shadow-sm">
          <View className="flex-row items-center mb-1">
            <Ionicons
              name={pickedUp ? 'home-outline' : 'storefront-outline'}
              size={20}
              color="#EC2828"
            />
            <Typography
              variant="body-base-bold"
              className="text-text-primary ml-2"
            >
              {pickedUp ? t('Courier.goToCustomer') : t('Courier.goToSpot')}
            </Typography>
          </View>
          <Typography variant="body-base-regular" className="text-gray-600 mt-1">
            {pickedUp && hasCustomer
              ? delivery.deliveryAddress
              : `${delivery.spotName}${delivery.spotAddress ? ` · ${delivery.spotAddress}` : ''}`}
          </Typography>
          {pickedUp && !!delivery.floor && (
            <Typography variant="body-small-regular" className="text-gray-500 mt-1">
              {delivery.apartmentNumber
                ? `${delivery.apartmentNumber}, `
                : ''}
              {delivery.floor}
            </Typography>
          )}
          {!pickedUp && (
            <Typography
              variant="body-small-regular"
              className="text-gray-400 mt-2"
            >
              {t('Courier.waitingForHandover')}
            </Typography>
          )}
          {pickedUp && !!delivery.noteForCourier && (
            <View className="mt-3 bg-amber-50 rounded-xl p-3">
              <Typography variant="body-small-semibold" className="text-amber-800">
                {t('Courier.note')}
              </Typography>
              <Typography variant="body-small-regular" className="text-amber-900 mt-0.5">
                {delivery.noteForCourier}
              </Typography>
            </View>
          )}
        </View>

        {/* Navigate */}
        <Pressable
          onPress={() => openNavigation(target.latitude, target.longitude, target.label)}
          className="flex-row items-center justify-center rounded-2xl py-4 mt-4"
          style={{ backgroundColor: '#2563EB' }}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Typography variant="body-base-bold" className="text-white ml-2">
            {t('Courier.navigate')}
          </Typography>
        </Pressable>

        {/* Advance status — prompts for the handover code first. */}
        <Pressable
          disabled={busy}
          onPress={() => setCodePrompt(pickedUp ? 'DELIVERED' : 'PICKED_UP')}
          className="rounded-2xl py-4 mt-3 items-center"
          style={{ backgroundColor: busy ? '#D1D5DB' : '#22C55E' }}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Typography variant="body-base-bold" className="text-white">
              {pickedUp ? t('Courier.markDelivered') : t('Courier.markPickedUp')}
            </Typography>
          )}
        </Pressable>

        {/* Report a problem */}
        <Pressable
          disabled={busy}
          onPress={() => setIncidentOpen(true)}
          className="flex-row items-center justify-center rounded-2xl py-4 mt-3 border border-red-200"
        >
          <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
          <Typography variant="body-base-bold" className="ml-2" style={{ color: '#DC2626' }}>
            {t('Courier.reportProblem')}
          </Typography>
        </Pressable>
      </ScrollView>

      {incidentOpen && (
        <IncidentModal
          orderId={delivery.id}
          onClose={() => setIncidentOpen(false)}
          onReported={() => {
            setIncidentOpen(false);
            Alert.alert(t('Courier.incidentTitle'), t('Courier.incidentSent'));
            router.replace('/(tabs)');
          }}
        />
      )}

      {codePrompt && (
        <CodeEntryModal
          mode={codePrompt}
          busy={busy}
          onClose={() => setCodePrompt(null)}
          onSubmit={(code) => advance(codePrompt, code)}
        />
      )}
    </View>
  );
}

// Modal asking the courier to type the handover code: the spot's pickup code
// to confirm PICKED_UP, or the customer's 4-digit PIN to confirm DELIVERED.
function CodeEntryModal({
  mode,
  busy,
  onClose,
  onSubmit,
}: {
  mode: 'PICKED_UP' | 'DELIVERED';
  busy: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isPin = mode === 'DELIVERED';

  const submit = async () => {
    if (!code.trim()) return;
    setError(null);
    try {
      await onSubmit(code.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Common.error'));
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white p-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row items-center justify-between mb-1">
            <Typography variant="body-lg-bold" className="text-text-primary">
              {t(isPin ? 'Courier.enterPinTitle' : 'Courier.enterPickupTitle')}
            </Typography>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
          <Typography variant="body-small-regular" className="text-gray-500 mb-4">
            {t(isPin ? 'Courier.enterPinHint' : 'Courier.enterPickupHint')}
          </Typography>
          <TextInput
            value={code}
            onChangeText={(v) => { setCode(v); setError(null); }}
            placeholder={isPin ? '••••' : 'ABCD'}
            placeholderTextColor="#9CA3AF"
            keyboardType={isPin ? 'number-pad' : 'default'}
            autoCapitalize="characters"
            maxLength={isPin ? 4 : 6}
            className="rounded-xl border border-gray-300 px-4 py-4 text-center"
            style={{ fontSize: 28, letterSpacing: 10, fontWeight: '700' }}
          />
          {error && (
            <View className="rounded-xl bg-red-50 px-4 py-3 mt-3">
              <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>{error}</Typography>
            </View>
          )}
          <Pressable
            onPress={submit}
            disabled={busy || !code.trim()}
            className="items-center rounded-2xl py-4 mt-4"
            style={{ backgroundColor: busy || !code.trim() ? '#86EFAC' : '#22C55E' }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-base-bold" className="text-white">
                {t(isPin ? 'Courier.markDelivered' : 'Courier.markPickedUp')}
              </Typography>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const INCIDENT_TYPES: { key: string; labelKey: string; icon: any }[] = [
  { key: 'bike_broken', labelKey: 'Courier.incidentBikeBroken', icon: 'bicycle-outline' },
  { key: 'address_not_found', labelKey: 'Courier.incidentAddressNotFound', icon: 'location-outline' },
  { key: 'customer_unreachable', labelKey: 'Courier.incidentCustomerUnreachable', icon: 'call-outline' },
  { key: 'other', labelKey: 'Courier.incidentOther', icon: 'ellipsis-horizontal' },
];

function IncidentModal({
  orderId,
  onClose,
  onReported,
}: {
  orderId: string;
  onClose: () => void;
  onReported: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPhoto = async (fromCamera: boolean) => {
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
  };

  const submit = async () => {
    if (!type) {
      setError(t('Courier.incidentPickType'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Upload the photo first (if any) → get its URL.
      let photoUrl: string | undefined;
      if (photoUri) {
        const up = await uploadDeliveryIncidentPhoto(orderId, photoUri);
        if (up.error || !up.data) throw new Error(up.error || 'upload failed');
        photoUrl = up.data.imageUrl;
      }
      const res = await reportDeliveryIncident({
        orderId,
        incidentType: type,
        note: note.trim() || undefined,
        photoUrl,
        cancel: true,
      });
      if (res.error) throw new Error(res.error.message);
      onReported();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Courier.incidentError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white p-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row items-center justify-between mb-1">
            <Typography variant="body-lg-bold" className="text-text-primary">
              {t('Courier.incidentTitle')}
            </Typography>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
          <Typography variant="body-small-regular" className="text-gray-500 mb-4">
            {t('Courier.incidentSubtitle')}
          </Typography>

          <ScrollView style={{ maxHeight: 420 }}>
            {/* Type chips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {INCIDENT_TYPES.map((it) => {
                const active = type === it.key;
                return (
                  <Pressable
                    key={it.key}
                    onPress={() => setType(it.key)}
                    className="flex-row items-center rounded-full border px-3 py-2"
                    style={{
                      borderColor: active ? '#EC2828' : '#D1D5DB',
                      backgroundColor: active ? '#FEECEC' : '#fff',
                    }}
                  >
                    <Ionicons name={it.icon} size={15} color={active ? '#EC2828' : '#6B7280'} />
                    <Typography
                      variant="body-small-semibold"
                      className="ml-1.5"
                      style={{ color: active ? '#EC2828' : '#374151' }}
                    >
                      {t(it.labelKey)}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('Courier.incidentNote')}
              placeholderTextColor="#9CA3AF"
              multiline
              className="rounded-xl border border-gray-300 px-4 py-3 mb-4"
              style={{ minHeight: 90, textAlignVertical: 'top', fontSize: 15 }}
            />

            {/* Photo */}
            {photoUri ? (
              <View className="mb-4">
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: 160, borderRadius: 12 }} />
                <Pressable onPress={() => setPhotoUri(null)} className="mt-2 self-start">
                  <Typography variant="body-small-semibold" style={{ color: '#DC2626' }}>
                    {t('Courier.cancel')}
                  </Typography>
                </Pressable>
              </View>
            ) : (
              <View className="flex-row gap-2 mb-4">
                <Pressable
                  onPress={() => pickPhoto(true)}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-300 py-3"
                >
                  <Ionicons name="camera-outline" size={18} color="#374151" />
                  <Typography variant="body-small-semibold" className="ml-2 text-gray-700">
                    {t('Courier.incidentTakePhoto')}
                  </Typography>
                </Pressable>
                <Pressable
                  onPress={() => pickPhoto(false)}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-300 py-3"
                >
                  <Ionicons name="images-outline" size={18} color="#374151" />
                  <Typography variant="body-small-semibold" className="ml-2 text-gray-700">
                    {t('Courier.incidentChoosePhoto')}
                  </Typography>
                </Pressable>
              </View>
            )}

            {error && (
              <View className="rounded-xl bg-red-50 px-4 py-3 mb-3">
                <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>{error}</Typography>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={submit}
            disabled={submitting}
            className="items-center rounded-2xl py-4 mt-1"
            style={{ backgroundColor: submitting ? '#F4A3A3' : '#EC2828' }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-base-bold" className="text-white">
                {t('Courier.incidentSubmit')}
              </Typography>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
