import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { config } from '@/config';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useToast } from '@/components/organisms/ToastProvider';
import { getStoredSpotContext } from '@/hooks/useSpotOrders';
import {
  getSpotDetails,
  updateSpotDetails,
  setSpotPhotos,
  type SpotDetails,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const inputCls = 'rounded-xl border border-gray-300 px-4 py-3 text-base';

// Uploads an image; throws with the server's error message (e.g. "Image is
// too large. Max 10 MB.") so the screen can show it.
async function uploadSpotImage(spotId: string, uri: string, type: 'logo' | 'cover' | 'photo') {
  const token = (await AsyncStorage.getItem('access_token')) ?? '';
  const form = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  if (uri.startsWith('data:') || uri.startsWith('blob:')) {
    const blob = await (await fetch(uri)).blob();
    form.append('image', blob, filename);
  } else {
    form.append('image', { uri, name: filename, type: 'image/jpeg' } as any);
  }
  const res = await fetch(`${config.REST_API_URL}/upload/spot/${spotId}?type=${type}`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }
}

export default function SpotDetailsScreen() {
  const { t } = useTranslation();
  const { isWide } = useBreakpoint();
  const toast = useToast();

  const [spot, setSpot] = useState<SpotDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    latitude: '',
    longitude: '',
    hasSeating: false,
    seatingCapacity: '',
    accessibilityFeatures: '',
    deliveryEnabled: true,
    deliveryFee: '',
    freeDeliveryThreshold: '',
    courierPayout: '',
  });
  const [hours, setHours] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const ctx = await getStoredSpotContext();
    if (!ctx.spotId) {
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotDetails(ctx.spotId, { token });
    const s = res.data;
    if (s) {
      setSpot(s);
      setForm({
        name: s.name ?? '',
        address: s.address ?? '',
        phone: s.phone ?? '',
        email: s.email ?? '',
        description: s.description ?? '',
        latitude: s.latitude != null ? String(s.latitude) : '',
        longitude: s.longitude != null ? String(s.longitude) : '',
        hasSeating: s.hasSeating ?? false,
        seatingCapacity: s.seatingCapacity != null ? String(s.seatingCapacity) : '',
        accessibilityFeatures: s.accessibilityFeatures ?? '',
        deliveryEnabled: s.deliveryEnabled ?? true,
        deliveryFee: s.deliveryFee != null ? String(s.deliveryFee) : '',
        freeDeliveryThreshold: s.freeDeliveryThreshold != null ? String(s.freeDeliveryThreshold) : '',
        courierPayout: s.courierPayout != null ? String(s.courierPayout) : '',
      });
      setHours(
        s.openingHours && typeof s.openingHours === 'object' ? { ...s.openingHours } : {},
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!spot) return;
    setSaving(true);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      // Only send GPS if both are valid numbers (avoid clobbering with NaN).
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      const gps =
        form.latitude.trim() && form.longitude.trim() && !isNaN(lat) && !isNaN(lng)
          ? { latitude: lat, longitude: lng }
          : {};
      const res = await updateSpotDetails(
        {
          id: spot.id,
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
          description: form.description,
          ...gps,
          openingHours: JSON.stringify(hours),
          hasSeating: form.hasSeating,
          seatingCapacity: form.seatingCapacity ? parseInt(form.seatingCapacity, 10) : undefined,
          accessibilityFeatures: form.accessibilityFeatures,
          deliveryEnabled: form.deliveryEnabled,
          deliveryFee: form.deliveryFee ? parseFloat(form.deliveryFee) : 0,
          freeDeliveryThreshold: form.freeDeliveryThreshold
            ? parseFloat(form.freeDeliveryThreshold)
            : undefined,
          courierPayout: form.courierPayout ? parseFloat(form.courierPayout) : 0,
        },
        { token },
      );
      if (res.error) toast.error(t('SpotDetails.saveError'));
      else toast.success(t('SpotDetails.saved'));
    } catch {
      toast.error(t('SpotDetails.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const pickAndUpload = async (type: 'logo' | 'cover' | 'photo') => {
    if (!spot) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;
    setSaving(true);
    try {
      await uploadSpotImage(spot.id, res.assets[0].uri, type);
      await load();
      toast.success(t('SpotDetails.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('SpotDetails.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async (url: string) => {
    if (!spot) return;
    setSaving(true);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const next = (spot.photos ?? []).filter((p) => p !== url);
      const res = await setSpotPhotos(spot.id, next, { token });
      if (res.error) toast.error(t('SpotDetails.saveError'));
      else await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#EC2828" />
      </View>
    );
  }

  if (!spot) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Typography variant="body-base-regular" className="text-center text-gray-500">
          {t('SpotDetails.noSpot')}
        </Typography>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('SpotDetails.title')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ResponsiveContainer maxWidth={640}>
          {/* Photos */}
          <View className="mb-6 gap-3">
            <PhotoRow label={t('SpotDetails.logo')} url={spot.logoUrl} onPress={() => pickAndUpload('logo')} t={t} />
            <PhotoRow label={t('SpotDetails.cover')} url={spot.coverUrl} onPress={() => pickAndUpload('cover')} t={t} />

            {/* Gallery: preview thumbnails with remove; plus an add button */}
            <View className="rounded-xl bg-white p-3">
              <Typography variant="body-small-semibold" className="mb-2 text-gray-700">
                {t('SpotDetails.gallery')} ({spot.photos?.length ?? 0})
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {(spot.photos ?? []).map((url) => (
                  <View key={url} className="relative">
                    <Image
                      source={{ uri: url }}
                      style={{ width: 84, height: 84, borderRadius: 10, backgroundColor: '#F3F4F6' }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => removePhoto(url)}
                      hitSlop={6}
                      className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: '#EC2828' }}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={() => pickAndUpload('photo')}
                  className="h-[84px] w-[84px] items-center justify-center rounded-xl border border-dashed border-gray-300"
                >
                  <Ionicons name="add" size={24} color="#6B7280" />
                  <Typography variant="body-very-small-medium" className="text-gray-500">
                    {t('SpotDetails.add')}
                  </Typography>
                </Pressable>
              </View>
            </View>
          </View>

          <Field label={t('SpotDetails.name')} value={form.name} onChangeText={set('name')} />
          <Field label={t('SpotDetails.address')} value={form.address} onChangeText={set('address')} />
          <Field label={t('SpotDetails.phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Field label={t('SpotDetails.email')} value={form.email} onChangeText={set('email')} keyboardType="email-address" />
          <Field label={t('SpotDetails.description')} value={form.description} onChangeText={set('description')} multiline />

          {/* GPS coordinates — drive the delivery-radius map. */}
          <Typography variant="body-small-semibold" className="mb-1.5 mt-1 text-gray-700">
            {t('SpotDetails.coordinates')}
          </Typography>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label={t('SpotDetails.latitude')}
                value={form.latitude}
                onChangeText={set('latitude')}
                keyboardType="numbers-and-punctuation"
                placeholder="52.2297"
              />
            </View>
            <View className="flex-1">
              <Field
                label={t('SpotDetails.longitude')}
                value={form.longitude}
                onChangeText={set('longitude')}
                keyboardType="numbers-and-punctuation"
                placeholder="21.0122"
              />
            </View>
          </View>

          {/* Opening hours */}
          <Typography variant="body-base-bold" className="mb-2 mt-4 text-text-primary">
            {t('SpotDetails.openingHours')}
          </Typography>
          <View className="mb-4 gap-2">
            {WEEKDAYS.map((day) => (
              <View key={day} className="flex-row items-center">
                <Typography variant="body-small-semibold" className="w-28 text-gray-600">
                  {t(`SpotDetails.weekday.${day}`)}
                </Typography>
                <TextInput
                  className={`${inputCls} flex-1`}
                  placeholder="10:00-22:00"
                  value={hours[day] ?? ''}
                  onChangeText={(v) => setHours((h) => ({ ...h, [day]: v }))}
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          {/* Seating */}
          <View className="mb-4 flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
            <Typography variant="body-base-regular" className="text-text-primary">
              {t('SpotDetails.hasSeating')}
            </Typography>
            <Switch
              value={form.hasSeating}
              onValueChange={(v) => setForm((f) => ({ ...f, hasSeating: v }))}
              trackColor={{ true: '#EC2828', false: '#D1D5DB' }}
              thumbColor="#fff"
            />
          </View>
          {form.hasSeating && (
            <Field
              label={t('SpotDetails.seatingCapacity')}
              value={form.seatingCapacity}
              onChangeText={set('seatingCapacity')}
              keyboardType="number-pad"
            />
          )}
          <Field
            label={t('SpotDetails.accessibility')}
            value={form.accessibilityFeatures}
            onChangeText={set('accessibilityFeatures')}
            multiline
          />

          {/* Delivery pricing */}
          <Typography variant="body-base-bold" className="mb-2 mt-4 text-text-primary">
            {t('SpotDetails.deliverySection')}
          </Typography>
          <View className="mb-2 flex-row items-center justify-between rounded-xl bg-white px-4 py-3">
            <Typography variant="body-base-regular" className="text-text-primary">
              {t('SpotDetails.deliveryEnabled')}
            </Typography>
            <Switch
              value={form.deliveryEnabled}
              onValueChange={(v) => setForm((f) => ({ ...f, deliveryEnabled: v }))}
              trackColor={{ true: '#EC2828', false: '#D1D5DB' }}
              thumbColor="#fff"
            />
          </View>
          {form.deliveryEnabled && (
            <>
              <Field
                label={t('SpotDetails.deliveryFee')}
                value={form.deliveryFee}
                onChangeText={set('deliveryFee')}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Field
                label={t('SpotDetails.freeDeliveryThreshold')}
                value={form.freeDeliveryThreshold}
                onChangeText={set('freeDeliveryThreshold')}
                keyboardType="decimal-pad"
                placeholder="—"
              />
              <Field
                label={t('SpotDetails.courierPayout')}
                value={form.courierPayout}
                onChangeText={set('courierPayout')}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Typography variant="body-very-small-regular" className="-mt-1 mb-1 ml-1 text-gray-400">
                {t('SpotDetails.courierPayoutHint')}
              </Typography>
            </>
          )}

          <Pressable
            onPress={save}
            disabled={saving}
            className="mt-4 items-center rounded-xl py-4"
            style={{ backgroundColor: saving ? '#F4A3A3' : '#EC2828' }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-base-bold" className="text-white">
                {t('SpotDetails.save')}
              </Typography>
            )}
          </Pressable>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-3">
      <Typography variant="body-small-semibold" className="mb-1.5 text-gray-700">
        {label}
      </Typography>
      <TextInput className={inputCls} {...props} />
    </View>
  );
}

function PhotoRow({
  label,
  url,
  onPress,
  t,
}: {
  label: string;
  url?: string | null;
  onPress: () => void;
  t: (k: string) => string;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center rounded-xl bg-white p-3">
      <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        {url ? (
          <Image source={{ uri: url }} style={{ width: 48, height: 48 }} resizeMode="cover" />
        ) : (
          <Ionicons name="image-outline" size={20} color="#9CA3AF" />
        )}
      </View>
      <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
        {label}
      </Typography>
      <Typography variant="body-small-semibold" style={{ color: '#EC2828' }}>
        {url ? t('SpotDetails.change') : t('SpotDetails.upload')}
      </Typography>
    </Pressable>
  );
}
