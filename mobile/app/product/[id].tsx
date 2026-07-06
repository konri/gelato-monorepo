import { Image } from '@/components/atoms/Image';
import { useCart } from '@/hooks/useCart';
import { useProductDetail } from '@/hooks/useOrdering';
import type { LocalizedText } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cart = useCart();

  const { data: product, loading } = useProductDetail(id ?? null);
  const inCart = product ? cart.itemQuantity('product', product.id) : 0;
  const [qty, setQty] = useState(1);

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
  if (!product) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="font-urbanist text-text-secondary">{t('Common.error')}</Text>
      </View>
    );
  }

  const name = localized(product.nameLocal, product.name);
  const description = localized(product.descriptionLocal, product.description);
  const priceLabel = (amount: number) =>
    t('Ordering.price', { amount: amount.toFixed(2).replace(/\.00$/, '') });

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="relative">
          <Image url={product.imageUrl ?? undefined} className="w-full h-72" resizeMode="cover" fallbackLogoSize={72} />
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
          <Text className="text-2xl font-urbanist-bold text-text-primary">{name}</Text>
          <Text className="text-lg font-urbanist-bold text-accent mt-1">
            {priceLabel(product.price)}
          </Text>

          <View className="bg-button-secondary self-start rounded-full px-3 py-1 mt-3">
            <Text className="text-xs font-urbanist-bold text-text-primary">
              {t(`Ordering.category.${product.type}`, { defaultValue: product.type })}
            </Text>
          </View>

          {description ? (
            <Text className="text-base font-urbanist text-text-secondary mt-4 leading-6">
              {description}
            </Text>
          ) : null}

          {product.allergens.length > 0 ? (
            <View className="rounded-2xl p-4 mt-4 border border-accent/30 bg-accent/5">
              <Text className="font-urbanist-bold text-accent mb-2">⚠️ {t('Tastes.allergens')}</Text>
              <Text className="font-urbanist text-accent-dark">
                {product.allergens.join(', ')}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom add-to-cart bar */}
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
                kind: 'product',
                refId: product.id,
                spotId: product.spotId,
                title: product.name,
                imageUrl: product.imageUrl,
                price: product.price,
              },
              qty,
            );
            router.back();
          }}
        >
          <Text className="text-white font-urbanist-bold text-base">
            {inCart > 0 ? t('Ordering.updateCart') : t('Ordering.addToCart')} ·{' '}
            {priceLabel(product.price * qty)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
