import { Image } from '@/components/atoms/Image';
import { BoxPickerModal } from '@/components/ordering/BoxPickerModal';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useCart } from '@/hooks/useCart';
import { buildMenuSections, MenuItem } from '@/hooks/useOrdering';
import { useSpotProducts } from '@/hooks/useOrdering';
import { useCities, useSpotsByCity, useSpotTastes } from '@/hooks/useTastes';
import type { City, Spot } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';

const matchesCity = (city: City, selected: string) => {
  const local = typeof city.nameLocal === 'object' && city.nameLocal ? city.nameLocal : {};
  return [city.name, local.pl, local.en, local.ua]
    .filter(Boolean)
    .some((n) => n!.toLowerCase() === selected.toLowerCase());
};

const price = (t: (k: string, o?: any) => string, amount: number) =>
  t('Ordering.price', { amount: amount.toFixed(2).replace(/\.00$/, '') });

export const OrderNow = () => {
  const { t } = useTranslation();
  const cart = useCart();

  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [chosenSpotId, setChosenSpotId] = useState<string | null>(null);

  // Re-read the selected city whenever this screen regains focus (e.g. after
  // the user changes their city in settings). If it changed, drop the spot
  // that was chosen for the previous city.
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

  const { data: cities } = useCities();
  const cityId = useMemo(() => {
    if (!cities || !selectedCityName) return null;
    return cities.find((c) => matchesCity(c, selectedCityName))?.id ?? null;
  }, [cities, selectedCityName]);

  const { data: spots, loading: spotsLoading, refetch: refetchSpots } = useSpotsByCity(cityId);
  // Only spots that actually deliver can be ordered from.
  const deliverySpots = useMemo(() => (spots ?? []).filter((s) => s.deliveryEnabled), [spots]);

  const activeSpot = useMemo(
    () => deliverySpots.find((s) => s.id === chosenSpotId) ?? null,
    [deliverySpots, chosenSpotId],
  );

  if (spotsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  if (activeSpot) {
    return <SpotMenu spot={activeSpot} onBack={() => setChosenSpotId(null)} />;
  }

  return <SpotPicker spots={deliverySpots} onSelect={setChosenSpotId} onRefresh={refetchSpots} />;
};

/* ---------- Spot picker ---------- */

const SpotPicker = ({
  spots,
  onSelect,
  onRefresh,
}: {
  spots: Spot[];
  onSelect: (id: string) => void;
  onRefresh: () => Promise<void>;
}) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-sm font-urbanist text-text-secondary">{t('Ordering.chooseSpot')}</Text>
      </View>
      {spots.length === 0 ? (
        <SectionList
          sections={[{ data: [] as Spot[] }]}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
          }
          renderItem={() => null}
          ListEmptyComponent={
            <View className="mx-6 mt-4 bg-background-secondary rounded-2xl p-8 items-center">
              <Text className="text-5xl mb-3">🛵</Text>
              <Text className="font-urbanist text-text-secondary text-center">
                {t('Ordering.noSpots')}
              </Text>
            </View>
          }
        />
      ) : (
        <SectionList
          sections={[{ data: spots }]}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
          }
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: TAB_BAR_TOTAL_HEIGHT + 8 }}
          renderItem={({ item: spot }) => (
            <Pressable
              className="mb-4 bg-white rounded-2xl overflow-hidden border border-gray-200"
              onPress={() => onSelect(spot.id)}
            >
              <Image
                url={spot.coverUrl ?? undefined}
                className="w-full h-36"
                resizeMode="cover"
                fallbackLogoSize={44}
              />
              <View className="p-4">
                <Text className="text-lg font-urbanist-bold text-text-primary" numberOfLines={1}>
                  {spot.name}
                </Text>
                <Text className="text-xs font-urbanist text-text-tertiary mt-1" numberOfLines={1}>
                  📍 {spot.address}
                </Text>
                <View className="flex-row items-center flex-wrap mt-2">
                  {spot.freeDeliveryThreshold ? (
                    <View className="bg-green-50 rounded-full px-3 py-1 mr-2 mb-1">
                      <Text className="text-xs font-urbanist-semibold text-green-700">
                        {t('Ordering.freeOver', { amount: spot.freeDeliveryThreshold })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};

/* ---------- Spot menu (tastes + products by type) ---------- */

const SpotMenu = ({ spot, onBack }: { spot: Spot; onBack: () => void }) => {
  const { t } = useTranslation();
  const cart = useCart();
  const { data: tastes, loading: tastesLoading, refetch: refetchTastes } = useSpotTastes(spot.id);
  const { data: products, loading: productsLoading, refetch: refetchProducts } = useSpotProducts(spot.id);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTastes(), refetchProducts()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTastes, refetchProducts]);

  const sections = useMemo(
    () => buildMenuSections(tastes ?? [], products ?? []),
    [tastes, products],
  );
  const loading = tastesLoading || productsLoading;

  return (
    <View className="flex-1 bg-white">
      {/* Spot header */}
      <Pressable className="px-6 pt-3 pb-2" onPress={onBack}>
        <Text className="text-sm font-urbanist-bold text-accent">‹ {t('Ordering.orderNow')}</Text>
      </Pressable>
      <View className="px-6 pb-2">
        <Text className="text-xl font-urbanist-bold text-text-primary" numberOfLines={1}>
          {spot.name}
        </Text>
        <Text className="text-xs font-urbanist text-text-secondary mt-0.5">
          {t('Ordering.deliversInKm', { km: (spot as any).deliveryRadiusKm ?? 5 })}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#EC2828" />
        </View>
      ) : sections.length === 0 ? (
        <View className="mx-6 mt-4 bg-background-secondary rounded-2xl p-8 items-center">
          <Text className="text-5xl mb-3">🍦</Text>
          <Text className="font-urbanist text-text-secondary text-center">
            {t('Ordering.noItems')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.kind}:${item.id}`}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
          }
          contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 96 }}
          renderSectionHeader={({ section }) => (
            <Text className="px-6 pt-4 pb-2 text-base font-urbanist-bold text-text-primary">
              {t(`Ordering.category.${section.type}`, { defaultValue: section.type })}
            </Text>
          )}
          renderItem={({ item }) => <MenuRow item={item} />}
        />
      )}

      <CartBar />
    </View>
  );
};

/* ---------- One menu row ---------- */

const MenuRow = ({ item }: { item: MenuItem }) => {
  const { t } = useTranslation();
  const cart = useCart();
  const qty = cart.itemQuantity(item.kind, item.id);
  const isBox = item.kind === 'product' && item.product?.isBox;
  const [boxOpen, setBoxOpen] = useState(false);

  const goDetail = () => {
    if (isBox) {
      setBoxOpen(true);
      return;
    }
    router.push(item.kind === 'taste' ? `/taste/${item.id}` : `/product/${item.id}`);
  };

  return (
    <View className="mx-6 mb-3 flex-row items-center bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <Pressable onPress={goDetail}>
        <Image
          url={item.imageUrl ?? undefined}
          className="w-20 h-20"
          resizeMode="cover"
          fallbackWidth={80}
          fallbackHeight={80}
          fallbackLogoSize={26}
        />
      </Pressable>
      <Pressable className="flex-1 px-3 py-2" onPress={goDetail}>
        <Text className="font-urbanist-bold text-text-primary" numberOfLines={1}>
          {item.title}
        </Text>
        {isBox ? (
          <Text className="text-xs font-urbanist text-text-secondary mt-0.5" numberOfLines={1}>
            {t('Ordering.box.pickUpTo', { max: item.product?.maxTastes ?? 0 })}
            {item.product?.weightGrams ? ` · ${item.product.weightGrams} g` : ''}
          </Text>
        ) : item.subtitle ? (
          <Text className="text-xs font-urbanist text-text-secondary mt-0.5" numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
        <Text className="text-sm font-urbanist-bold text-accent mt-1">
          {price(t, item.price)}
        </Text>
      </Pressable>

      {/* Add / stepper */}
      <View className="pr-3">
        {isBox ? (
          <Pressable className="bg-accent rounded-full px-4 py-2" onPress={() => setBoxOpen(true)}>
            <Text className="text-white text-sm font-urbanist-bold">{t('Ordering.box.build')}</Text>
          </Pressable>
        ) : qty === 0 ? (
          <Pressable
            className="bg-accent rounded-full px-4 py-2"
            onPress={() =>
              cart.addItem({
                kind: item.kind,
                refId: item.id,
                spotId: item.spotId,
                title: item.title,
                imageUrl: item.imageUrl,
                price: item.price,
              })
            }
          >
            <Text className="text-white text-sm font-urbanist-bold">{t('Ordering.add')}</Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center">
            <Pressable
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => cart.setQuantity(item.kind, item.id, qty - 1)}
            >
              <Text className="text-lg font-urbanist-bold text-text-primary">−</Text>
            </Pressable>
            <Text className="w-7 text-center font-urbanist-bold text-text-primary">{qty}</Text>
            <Pressable
              className="w-8 h-8 rounded-full bg-accent items-center justify-center"
              onPress={() => cart.setQuantity(item.kind, item.id, qty + 1)}
            >
              <Text className="text-lg font-urbanist-bold text-white">+</Text>
            </Pressable>
          </View>
        )}
      </View>

      {isBox && item.product ? (
        <BoxPickerModal
          product={item.product}
          visible={boxOpen}
          onClose={() => setBoxOpen(false)}
          onConfirm={(selections) => {
            cart.addBox(
              {
                kind: 'product',
                refId: item.id,
                spotId: item.spotId,
                title: item.title,
                imageUrl: item.imageUrl,
                price: item.price,
                boxSelections: selections,
                weightGrams: item.product?.weightGrams,
              },
              1,
            );
            setBoxOpen(false);
          }}
        />
      ) : null}
    </View>
  );
};

/* ---------- Floating cart bar ---------- */

const CartBar = () => {
  const { t } = useTranslation();
  const cart = useCart();
  if (cart.count === 0) return null;

  return (
    <View
      className="absolute left-4 right-4"
      style={{ bottom: TAB_BAR_TOTAL_HEIGHT - 8 }}
      pointerEvents="box-none"
    >
      <Pressable
        className="flex-row items-center justify-between bg-accent rounded-2xl px-5 py-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        }}
        onPress={() => router.push('/order/cart')}
      >
        <View className="bg-white/25 rounded-full px-3 py-1">
          <Text className="text-white font-urbanist-bold">{cart.count}</Text>
        </View>
        <Text className="text-white font-urbanist-bold text-base">{t('Ordering.viewCart')}</Text>
        <Text className="text-white font-urbanist-bold text-base">
          {t('Ordering.price', { amount: cart.subtotal.toFixed(2).replace(/\.00$/, '') })}
        </Text>
      </Pressable>
    </View>
  );
};
