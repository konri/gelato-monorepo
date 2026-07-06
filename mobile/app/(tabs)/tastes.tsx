import { Image } from '@/components/atoms/Image';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useCities, useSpotsByCity, useSpotTastes } from '@/hooks/useTastes';
import type { City, Spot, Taste } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const matchesCity = (city: City, selected: string) => {
  const local = typeof city.nameLocal === 'object' && city.nameLocal ? city.nameLocal : {};
  return [city.name, local.pl, local.en, local.ua]
    .filter(Boolean)
    .some((n) => n!.toLowerCase() === selected.toLowerCase());
};

export default function TastesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [chosenSpotId, setChosenSpotId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Re-read the selected city on focus so a city change in settings is picked
  // up; drop the chosen spot if the city changed.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem('selectedCity').then((city) => {
        if (!active) return;
        setSelectedCityName((prev) => {
          if (prev !== null && prev !== city) setChosenSpotId(null);
          return city;
        });
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // Tapping the Tastes tab while viewing a spot's tastes returns to the spot
  // list. The tabPress event fires on the tab navigator, which may be the
  // current navigation or its parent depending on nesting — listen on both.
  useEffect(() => {
    const reset = () => setChosenSpotId(null);
    const parent = navigation.getParent?.();
    const unsub1 = navigation.addListener('tabPress' as any, reset);
    const unsub2 = parent?.addListener('tabPress' as any, reset);
    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [navigation]);

  const { data: cities, loading: citiesLoading, refetch: refetchCities } = useCities();

  const cityId = useMemo(() => {
    if (!cities || !selectedCityName) return null;
    return cities.find((c) => matchesCity(c, selectedCityName))?.id ?? null;
  }, [cities, selectedCityName]);

  const { data: spots, loading: spotsLoading, refetch: refetchSpots } = useSpotsByCity(cityId);

  const singleSpot = spots && spots.length === 1 ? spots[0] : null;
  const activeSpotId = chosenSpotId ?? singleSpot?.id ?? null;
  const activeSpot = useMemo(
    () => spots?.find((s) => s.id === activeSpotId) ?? null,
    [spots, activeSpotId],
  );

  const { data: tastes, loading: tastesLoading, refetch: refetchTastes } =
    useSpotTastes(activeSpotId);

  const loading = citiesLoading || spotsLoading;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-read the selected city too, in case it changed while away.
      const storedCity = await AsyncStorage.getItem('selectedCity');
      setSelectedCityName(storedCity);
      await Promise.all([
        refetchCities(),
        refetchSpots(),
        activeSpotId ? refetchTastes() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCities, refetchSpots, refetchTastes, activeSpotId]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-urbanist-bold text-text-primary">{t('Tabs.tastes')}</Text>
        <Text className="text-sm font-urbanist text-text-secondary mt-1">
          {selectedCityName
            ? t('Tastes.inCity', { city: selectedCityName })
            : t('Tastes.subtitle')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EC2828"
            colors={['#EC2828']}
          />
        }
      >
        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#EC2828" />
          </View>
        ) : activeSpot ? (
          <TastesList
            spot={activeSpot}
            tastes={tastes ?? []}
            tastesLoading={tastesLoading}
            showBack={(spots?.length ?? 0) > 1}
            onBack={() => setChosenSpotId(null)}
          />
        ) : (
          <SpotList spots={spots ?? []} onSelect={setChosenSpotId} />
        )}
      </ScrollView>
    </View>
  );
}

function SpotHeaderCard({ spot }: { spot: Spot }) {
  return (
    <Pressable
      className="mx-6 mb-4 bg-white rounded-2xl overflow-hidden border border-gray-200"
      onPress={() => router.push(`/spot/${spot.id}`)}
    >
      <Image
        url={spot.coverUrl ?? undefined}
        className="w-full h-36"
        resizeMode="cover"
        fallbackLogoSize={44}
      />
      <View className="flex-row items-center p-4">
        {spot.logoUrl ? (
          <Image
            url={spot.logoUrl}
            className="w-12 h-12 rounded-full mr-3"
            rounded
            fallbackWidth={48}
            fallbackHeight={48}
            fallbackLogoSize={20}
          />
        ) : null}
        <View className="flex-1">
          <Text className="text-lg font-urbanist-bold text-text-primary" numberOfLines={1}>
            {spot.name}
          </Text>
          <Text className="text-xs font-urbanist text-text-secondary mt-0.5" numberOfLines={1}>
            📍 {spot.address}
          </Text>
        </View>
        <Text className="text-text-secondary text-lg">›</Text>
      </View>
    </Pressable>
  );
}

function TastesList({
  spot,
  tastes,
  tastesLoading,
  showBack,
  onBack,
}: {
  spot: Spot;
  tastes: Taste[];
  tastesLoading: boolean;
  showBack: boolean;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="pt-4">
      <SpotHeaderCard spot={spot} />

      {showBack ? (
        <Pressable className="px-6 mb-3" onPress={onBack}>
          <Text className="text-sm font-urbanist-bold text-accent">‹ {t('Tastes.allSpots')}</Text>
        </Pressable>
      ) : null}

      {tastesLoading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#EC2828" />
        </View>
      ) : tastes.length === 0 ? (
        <View className="mx-6 bg-background-secondary rounded-2xl p-8 items-center">
          <Text className="text-5xl mb-3">🍦</Text>
          <Text className="font-urbanist text-text-secondary text-center">
            {t('Tastes.noFlavors')}
          </Text>
        </View>
      ) : (
        <View className="px-4 flex-row flex-wrap">
          {tastes.map((taste) => (
            <View key={taste.id} className="w-1/2 px-2 mb-4">
              <Pressable
                className="bg-white rounded-2xl overflow-hidden border border-gray-200"
                onPress={() => router.push(`/taste/${taste.id}`)}
              >
                <Image
                  url={taste.imageUrl ?? undefined}
                  className="w-full h-32"
                  resizeMode="cover"
                  fallbackLogoSize={40}
                />
                <View className="p-3">
                  <Text className="text-sm font-urbanist-bold text-text-primary" numberOfLines={1}>
                    {taste.title}
                  </Text>
                  {taste.subtitle ? (
                    <Text
                      className="text-xs font-urbanist text-text-secondary mt-1"
                      numberOfLines={1}
                    >
                      {taste.subtitle}
                    </Text>
                  ) : null}
                  {taste.kcalPerPortion != null ? (
                    <Text className="text-xs font-urbanist text-text-tertiary mt-2">
                      {Math.round(taste.kcalPerPortion)} kcal
                    </Text>
                  ) : null}
                  {taste.allergens.length > 0 ? (
                    <Text className="text-xs font-urbanist text-accent mt-1">
                      ⚠️ {t('Tastes.allergens')}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function SpotList({ spots, onSelect }: { spots: Spot[]; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  if (spots.length === 0) {
    return (
      <View className="mx-6 mt-6 bg-background-secondary rounded-2xl p-8 items-center">
        <Text className="text-5xl mb-3">🍨</Text>
        <Text className="font-urbanist text-text-secondary text-center">{t('Tastes.noSpots')}</Text>
      </View>
    );
  }
  return (
    <View className="pt-4 px-6">
      {spots.map((spot) => (
        <Pressable
          key={spot.id}
          className="mb-4 bg-white rounded-2xl overflow-hidden border border-gray-200"
          onPress={() => onSelect(spot.id)}
        >
          <Image
            url={spot.coverUrl ?? undefined}
            className="w-full h-40"
            resizeMode="cover"
            fallbackLogoSize={48}
          />
          <View className="p-4">
            <Text className="text-lg font-urbanist-bold text-text-primary" numberOfLines={1}>
              {spot.name}
            </Text>
            {spot.description ? (
              <Text className="text-sm font-urbanist text-text-secondary mt-1" numberOfLines={2}>
                {spot.description}
              </Text>
            ) : null}
            <Text className="text-xs font-urbanist text-text-tertiary mt-2" numberOfLines={1}>
              📍 {spot.address}
            </Text>
            <View className="mt-3 self-start bg-accent rounded-xl px-4 py-2">
              <Text className="text-white text-sm font-urbanist-bold">{t('Tastes.viewTastes')}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
