import { Typography } from '@/components/atoms/Typography';
import { DeliveryMap } from '@/components/molecules/DeliveryMap';
import { useMyActiveDelivery } from '@/hooks/useCourierApplications';
import { useCourierLocationPing } from '@/hooks/useCourierLocationPing';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { openNavigation } from '@/utils/mapsNavigation';
import { updateDeliveryStatus } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ActiveDeliveryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: delivery, loading, refetch } = useMyActiveDelivery();
  const { location } = useCurrentLocation();
  const [busy, setBusy] = useState(false);

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

  const advance = async (next: 'PICKED_UP' | 'DELIVERED') => {
    setBusy(true);
    try {
      const res = await updateDeliveryStatus(delivery.id, next);
      if (res.error) {
        Alert.alert(t('Common.error'), res.error.message);
        return;
      }
      if (next === 'DELIVERED') {
        Alert.alert(t('Courier.deliveredTitle'), t('Courier.deliveredBody'));
        router.replace('/(tabs)');
        return;
      }
      await refetch();
    } catch (e) {
      Alert.alert(t('Common.error'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelivered = () => {
    Alert.alert(
      t('Courier.confirmDeliveredTitle'),
      t('Courier.confirmDeliveredBody'),
      [
        { text: t('Courier.cancel'), style: 'cancel' },
        { text: t('Courier.confirm'), onPress: () => advance('DELIVERED') },
      ],
    );
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

        {/* Advance status */}
        <Pressable
          disabled={busy}
          onPress={() => (pickedUp ? confirmDelivered() : advance('PICKED_UP'))}
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
      </ScrollView>
    </View>
  );
}
