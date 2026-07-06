import { Image } from '@/components/atoms/Image';
import { useCart } from '@/hooks/useCart';
import { useTasteDetail } from '@/hooks/useTastes';
import type { LocalizedText } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPE_LABEL_KEY: Record<string, string> = {
  SORBET: 'Tastes.type.sorbet',
  MILK: 'Tastes.type.milk',
  GELATO: 'Tastes.type.gelato',
  VEGAN: 'Tastes.type.vegan',
  OTHER: 'Tastes.type.other',
};

export default function TasteDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [qty, setQty] = useState(1);
  const cart = useCart();

  const { data: taste, loading, refetch } = useTasteDetail(id ?? null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const localized = (value: LocalizedText | undefined, fallback?: string | null): string => {
    if (!value) return fallback ?? '';
    if (typeof value === 'string') return value;
    const lang = i18n.language.split('-')[0] as 'pl' | 'en' | 'ua';
    return value[lang] || value.en || fallback || '';
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  if (!taste) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6" style={{ paddingTop: insets.top }}>
        <Pressable onPress={() => router.back()} className="absolute left-4" style={{ top: insets.top + 8 }}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="font-urbanist text-text-secondary">{t('Common.error')}</Text>
      </View>
    );
  }

  const title = localized(taste.titleLocal, taste.title);
  const description = localized(taste.descriptionLocal, taste.description);
  const ingredientsHtml = localized(taste.ingredientsLocal, taste.ingredients);
  const typeLabel = TYPE_LABEL_KEY[taste.type] ? t(TYPE_LABEL_KEY[taste.type]) : taste.type;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EC2828"
            colors={['#EC2828']}
          />
        }
      >
        <View className="relative">
          <Image url={taste.imageUrl ?? undefined} className="w-full h-72" resizeMode="cover" fallbackLogoSize={72} />
          <Pressable
            onPress={() => router.back()}
            className="absolute left-4 bg-white/90 rounded-full p-2"
            style={{ top: insets.top + 8 }}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color="#212121" />
          </Pressable>
        </View>

        <View className="px-6 pt-5">
          <Text className="text-2xl font-urbanist-bold text-text-primary">{title}</Text>

          <View className="flex-row items-center flex-wrap mt-2">
            <View className="bg-button-secondary rounded-full px-3 py-1 mr-2 mb-1">
              <Text className="text-xs font-urbanist-bold text-text-primary">{typeLabel}</Text>
            </View>
            {taste.subtitle ? (
              <Text className="text-sm font-urbanist text-text-secondary mb-1">{taste.subtitle}</Text>
            ) : null}
          </View>

          {description ? (
            <Text className="text-base font-urbanist text-text-secondary mt-3 leading-6">
              {description}
            </Text>
          ) : null}

          {/* Energy */}
          {taste.kcalPerPortion != null || taste.kcalPer100g != null ? (
            <View className="bg-background-secondary rounded-2xl p-4 mt-6">
              <Text className="font-urbanist-bold text-text-primary mb-3">{t('Tastes.energy')}</Text>
              <View className="flex-row">
                {taste.kcalPerPortion != null ? (
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-urbanist-bold text-text-primary">
                      {Math.round(taste.kcalPerPortion)}
                    </Text>
                    <Text className="text-xs font-urbanist text-text-secondary mt-1 text-center">
                      {t('Tastes.kcalPerPortion')}
                    </Text>
                    {taste.portionSizeGrams != null ? (
                      <Text className="text-[10px] font-urbanist text-text-tertiary mt-0.5">
                        {t('Tastes.portionSize', { grams: Math.round(taste.portionSizeGrams) })}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {taste.kcalPerPortion != null && taste.kcalPer100g != null ? (
                  <View className="w-px bg-gray-200 mx-2" />
                ) : null}
                {taste.kcalPer100g != null ? (
                  <View className="flex-1 items-center">
                    <Text className="text-2xl font-urbanist-bold text-text-primary">
                      {Math.round(taste.kcalPer100g)}
                    </Text>
                    <Text className="text-xs font-urbanist text-text-secondary mt-1 text-center">
                      {t('Tastes.kcalPer100g')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Allergens */}
          {taste.allergens.length > 0 ? (
            <View className="rounded-2xl p-4 mt-4 border border-accent/30 bg-accent/5">
              <Text className="font-urbanist-bold text-accent mb-2">⚠️ {t('Tastes.allergens')}</Text>
              <View className="flex-row flex-wrap">
                {taste.allergens.map((a) => (
                  <View key={a} className="bg-white rounded-full px-3 py-1 mr-2 mb-2 border border-accent/20">
                    <Text className="text-xs font-urbanist text-accent-dark">
                      {t(`Tastes.allergen.${a}`, { defaultValue: a })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Ingredients (rich HTML) */}
          {ingredientsHtml ? (
            <View className="bg-background-secondary rounded-2xl p-4 mt-4">
              <Text className="font-urbanist-bold text-text-primary mb-2">
                {t('Tastes.ingredients')}
              </Text>
              <RenderHtml
                contentWidth={width - 80}
                source={{ html: ingredientsHtml }}
                baseStyle={{ color: '#616161', fontSize: 14, lineHeight: 22 }}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Add to cart */}
      <View
        className="border-t border-gray-200 bg-white px-6 pt-3 flex-row items-center"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center mr-4">
          <Pressable
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
            onPress={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Text className="text-xl font-urbanist-bold text-text-primary">−</Text>
          </Pressable>
          <Text className="w-9 text-center font-urbanist-bold text-text-primary text-base">{qty}</Text>
          <Pressable
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
            onPress={() => setQty((q) => q + 1)}
          >
            <Text className="text-xl font-urbanist-bold text-text-primary">+</Text>
          </Pressable>
        </View>
        <Pressable
          className="flex-1 bg-accent rounded-2xl py-3.5 items-center"
          onPress={() => {
            cart.addItem(
              {
                kind: 'taste',
                refId: taste.id,
                spotId: taste.spotId,
                title: taste.title,
                imageUrl: taste.imageUrl,
                price: taste.price,
              },
              qty,
            );
            router.back();
          }}
        >
          <Text className="text-white font-urbanist-bold text-base">
            {t('Ordering.addToCart')} ·{' '}
            {t('Ordering.price', {
              amount: (taste.price * qty).toFixed(2).replace(/\.00$/, ''),
            })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
