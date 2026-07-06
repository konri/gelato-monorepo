import { useCart } from '@/hooks/useCart';
import { useDeliveryCheck } from '@/hooks/useOrdering';
import { useSpotDetail } from '@/hooks/useTastes';
import {
  GeocodedPlace,
  PlacePrediction,
  fetchPlaceDetails,
  fetchPlacePredictions,
  isPlacesConfigured,
  newSessionToken,
  reverseGeocode,
  staticMapUrl,
} from '@/services/googlePlaces';
import { getLocation, requestLocationPermission } from '@/services/locationService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddressScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cart = useCart();
  const { data: spot } = useSpotDetail(cart.spotId);
  const delivery = useDeliveryCheck();

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<GeocodedPlace | null>(null);
  const sessionToken = useRef(newSessionToken());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placesReady = isPlacesConfigured();

  // Debounced autocomplete.
  useEffect(() => {
    if (selected) return; // don't re-search after a pick
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 3) {
      setPredictions([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      const bias = spot ? { latitude: spot.latitude, longitude: spot.longitude } : undefined;
      const preds = await fetchPlacePredictions(query, sessionToken.current, bias);
      setPredictions(preds);
      setSearching(false);
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, selected, spot]);

  const resolvePlace = async (place: GeocodedPlace | null) => {
    if (!place || !spot) return;
    setSelected(place);
    setPredictions([]);
    setQuery(place.address);
    await delivery.check(spot.id, place.latitude, place.longitude);
  };

  const onPickPrediction = async (p: PlacePrediction) => {
    const place = await fetchPlaceDetails(p.placeId, sessionToken.current);
    sessionToken.current = newSessionToken();
    await resolvePlace(place);
  };

  const onUseMyLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) return;
    const loc = await getLocation();
    if (!loc) return;
    const place = await reverseGeocode(loc.latitude, loc.longitude);
    await resolvePlace(place ?? { address: t('Address.myLocation'), ...loc });
  };

  const clearSelection = () => {
    setSelected(null);
    delivery.reset();
    setQuery('');
  };

  const mapUrl = useMemo(() => {
    if (!selected || !spot) return null;
    return staticMapUrl({
      spot: { latitude: spot.latitude, longitude: spot.longitude },
      destination: { latitude: selected.latitude, longitude: selected.longitude },
      width: width - 32,
      height: 180,
    });
  }, [selected, spot, width]);

  const canContinue = !!selected && delivery.result?.canDeliver === true;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="text-lg font-urbanist-bold text-text-primary flex-1">
          {t('Address.title')}
        </Text>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
        {/* Search input */}
        <View className="flex-row items-center bg-background-secondary rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9E9E9E" />
          <TextInput
            className="flex-1 ml-2 text-base text-text-primary"
            style={{ fontFamily: 'Urbanist' }}
            placeholder={t('Address.searchPlaceholder')}
            placeholderTextColor="#9E9E9E"
            value={query}
            onChangeText={(txt) => {
              if (selected) clearSelection();
              setQuery(txt);
            }}
            autoCorrect={false}
          />
          {selected ? (
            <Pressable onPress={clearSelection} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#9E9E9E" />
            </Pressable>
          ) : searching ? (
            <ActivityIndicator size="small" color="#EC2828" />
          ) : null}
        </View>

        {!placesReady ? (
          <Text className="text-xs font-urbanist text-amber-600 mt-2">
            {t('Address.placesUnavailable')}
          </Text>
        ) : null}

        {/* Use my location */}
        {!selected ? (
          <Pressable className="flex-row items-center mt-3 px-1" onPress={onUseMyLocation}>
            <Ionicons name="locate" size={18} color="#EC2828" />
            <Text className="ml-2 font-urbanist-semibold text-accent">
              {t('Address.useMyLocation')}
            </Text>
          </Pressable>
        ) : null}

        {/* Predictions */}
        {predictions.map((p) => (
          <Pressable
            key={p.placeId}
            className="flex-row items-start py-3 border-b border-gray-100"
            onPress={() => onPickPrediction(p)}
          >
            <Ionicons name="location-outline" size={18} color="#9E9E9E" style={{ marginTop: 2 }} />
            <View className="ml-2 flex-1">
              <Text className="font-urbanist-semibold text-text-primary">{p.primaryText}</Text>
              {p.secondaryText ? (
                <Text className="text-xs font-urbanist text-text-secondary">{p.secondaryText}</Text>
              ) : null}
            </View>
          </Pressable>
        ))}

        {/* Selected address + delivery result */}
        {selected ? (
          <View className="mt-4">
            {mapUrl ? (
              <Image
                source={{ uri: mapUrl }}
                style={{ width: '100%', height: 180, borderRadius: 16 }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-44 rounded-2xl bg-background-secondary items-center justify-center">
                <Text className="text-4xl">🗺️</Text>
              </View>
            )}

            <View className="mt-3 bg-background-secondary rounded-2xl p-4">
              <Text className="font-urbanist-bold text-text-primary">{selected.address}</Text>

              {delivery.checking ? (
                <View className="flex-row items-center mt-3">
                  <ActivityIndicator size="small" color="#EC2828" />
                  <Text className="ml-2 font-urbanist text-text-secondary">
                    {t('Address.checking')}
                  </Text>
                </View>
              ) : delivery.result ? (
                <View className="mt-3">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={delivery.result.canDeliver ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={delivery.result.canDeliver ? '#16A34A' : '#EC2828'}
                    />
                    <Text
                      className={`ml-2 font-urbanist-bold ${
                        delivery.result.canDeliver ? 'text-green-700' : 'text-accent'
                      }`}
                    >
                      {delivery.result.canDeliver
                        ? t('Address.canDeliver')
                        : t('Address.cannotDeliver')}
                    </Text>
                  </View>
                  <Text className="text-xs font-urbanist text-text-secondary mt-1">
                    {t('Address.distanceInfo', {
                      distance: delivery.result.distanceKm,
                      radius: delivery.result.deliveryRadiusKm,
                    })}
                  </Text>
                  {!delivery.result.canDeliver ? (
                    <Text className="text-xs font-urbanist text-accent mt-1">
                      {t('Address.tryCloser')}
                    </Text>
                  ) : null}
                </View>
              ) : delivery.error ? (
                <Text className="mt-3 font-urbanist text-accent">{delivery.error}</Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Continue */}
      <View
        className="border-t border-gray-200 px-6 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          disabled={!canContinue}
          className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-accent' : 'bg-gray-200'}`}
          onPress={() => {
            if (!selected || !delivery.result) return;
            // Persist the validated address so Phase 3 (order form) can pick it up.
            cart.setDelivery({
              address: selected.address,
              latitude: selected.latitude,
              longitude: selected.longitude,
              distanceKm: delivery.result.distanceKm,
              deliveryFee: delivery.result.deliveryFee,
              freeDeliveryThreshold: delivery.result.freeDeliveryThreshold,
            });
            router.push('/order/details');
          }}
        >
          <Text
            className={`font-urbanist-bold text-base ${
              canContinue ? 'text-white' : 'text-text-tertiary'
            }`}
          >
            {t('Address.continue')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
