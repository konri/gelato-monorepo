import { Image } from '@/components/atoms/Image';
import { isSpotOpenNow, useFavoriteToggle } from '@/hooks/useSpots';
import { useCities, useSpotsByCity } from '@/hooks/useTastes';
import type { City, Spot } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_SPACING = 12;

const matchesCity = (city: City, selected: string) => {
  const local = typeof city.nameLocal === 'object' && city.nameLocal ? city.nameLocal : {};
  return [city.name, local.pl, local.en, local.ua]
    .filter(Boolean)
    .some((n) => n!.toLowerCase() === selected.toLowerCase());
};

export default function SpotsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList<Spot>>(null);
  const fav = useFavoriteToggle();

  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('selectedCity').then(setSelectedCityName);
    }, []),
  );

  const { data: cities } = useCities();
  const cityId = useMemo(() => {
    if (!cities || !selectedCityName) return null;
    return cities.find((c) => matchesCity(c, selectedCityName))?.id ?? null;
  }, [cities, selectedCityName]);

  const { data: spots, loading } = useSpotsByCity(cityId);
  const spotList = spots ?? [];

  // Region centered on the first spot (fallback: Warsaw).
  const initialRegion = useMemo(() => {
    const s = spotList[0];
    return {
      latitude: s?.latitude ?? 52.2297,
      longitude: s?.longitude ?? 21.0122,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [spotList]);

  const focusSpot = useCallback((spot: Spot) => {
    mapRef.current?.animateToRegion(
      {
        latitude: spot.latitude,
        longitude: spot.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350,
    );
  }, []);

  // When the carousel settles on a card, pan the map to it.
  const onCarouselScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING));
      const spot = spotList[index];
      if (spot) {
        setActiveIndex(index);
        focusSpot(spot);
      }
    },
    [spotList, focusSpot],
  );

  const onMarkerPress = useCallback(
    (index: number) => {
      setActiveIndex(index);
      listRef.current?.scrollToOffset({
        offset: index * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
      focusSpot(spotList[index]);
    },
    [spotList, focusSpot],
  );

  const activeSpot = spotList[activeIndex] ?? null;

  return (
    <View className="flex-1 bg-white">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Delivery radius of the currently-selected spot */}
        {activeSpot && activeSpot.deliveryEnabled && activeSpot.deliveryRadiusKm ? (
          <Circle
            center={{ latitude: activeSpot.latitude, longitude: activeSpot.longitude }}
            radius={activeSpot.deliveryRadiusKm * 1000}
            strokeColor="rgba(236,40,40,0.6)"
            fillColor="rgba(236,40,40,0.10)"
            strokeWidth={2}
          />
        ) : null}
        {spotList.map((spot, index) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            title={spot.name}
            description={spot.address}
            pinColor="#EC2828"
            onPress={() => onMarkerPress(index)}
          />
        ))}
      </MapView>

      {/* Header overlay */}
      <View className="absolute left-0 right-0 px-6" style={{ top: insets.top + 8 }} pointerEvents="none">
        <View className="self-start bg-white rounded-full px-4 py-2 shadow">
          <Text className="text-lg font-urbanist-bold text-text-primary">{t('Spots.title')}</Text>
        </View>
      </View>

      {/* Bottom carousel */}
      {loading ? (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <ActivityIndicator size="large" color="#EC2828" />
        </View>
      ) : spotList.length === 0 ? (
        <View className="absolute bottom-10 left-6 right-6 bg-white rounded-2xl p-6 items-center shadow">
          <Text className="text-4xl mb-2">🍨</Text>
          <Text className="font-urbanist text-text-secondary text-center">{t('Spots.noSpots')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={spotList}
          keyExtractor={(s) => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          onMomentumScrollEnd={onCarouselScroll}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          style={{ position: 'absolute', bottom: insets.bottom + 90, left: 0, right: 0 }}
          ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
          renderItem={({ item }) => (
            <SpotCarouselCard spot={item} width={CARD_WIDTH} fav={fav} />
          )}
        />
      )}
    </View>
  );
}

const SpotCarouselCard = ({
  spot,
  width: cardWidth,
  fav,
}: {
  spot: Spot;
  width: number;
  fav: ReturnType<typeof useFavoriteToggle>;
}) => {
  const { t } = useTranslation();
  const open = isSpotOpenNow(spot.openingHours);
  const favorited = fav.isFavorite(spot.id, spot.isFavorite);

  return (
    <Pressable
      style={{ width: cardWidth }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200"
      onPress={() => router.push(`/spot/${spot.id}`)}
    >
      <View className="relative">
        <Image url={spot.coverUrl ?? undefined} className="w-full h-32" resizeMode="cover" fallbackLogoSize={40} />
        {/* Favorite heart */}
        <Pressable
          className="absolute top-2 right-2 bg-white/90 rounded-full p-2"
          hitSlop={8}
          onPress={() => fav.toggle(spot.id, favorited)}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={20}
            color={favorited ? '#EC2828' : '#616161'}
          />
        </Pressable>
        {/* Open / closed badge */}
        {open !== null ? (
          <View
            className={`absolute bottom-2 left-2 rounded-full px-3 py-1 ${open ? 'bg-green-600' : 'bg-gray-700'}`}
          >
            <Text className="text-white text-xs font-urbanist-bold">
              {open ? t('Spots.openNow') : t('Spots.closed')}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="p-3">
        <Text className="font-urbanist-bold text-text-primary" numberOfLines={1}>
          {spot.name}
        </Text>
        <Text className="text-xs font-urbanist text-text-secondary mt-0.5" numberOfLines={1}>
          📍 {spot.address}
        </Text>
      </View>
    </Pressable>
  );
};
