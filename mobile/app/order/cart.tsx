import { Image } from '@/components/atoms/Image';
import { useCart } from '@/hooks/useCart';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cart = useCart();

  const priceLabel = (amount: number) =>
    t('Ordering.price', { amount: amount.toFixed(2).replace(/\.00$/, '') });

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Text className="text-lg font-urbanist-bold text-text-primary flex-1">
          {t('Ordering.viewCart')}
        </Text>
        {cart.count > 0 ? (
          <Pressable onPress={() => cart.clear()} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color="#EC2828" />
          </Pressable>
        ) : null}
      </View>

      {cart.count === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-3">🛒</Text>
          <Text className="font-urbanist text-text-secondary text-center">
            {t('Ordering.myOrdersEmpty')}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {cart.items.map((item) => {
              const key = cart.lineKey(item);
              return (
                <View
                  key={key}
                  className="flex-row items-center bg-white rounded-2xl border border-gray-200 overflow-hidden mb-3"
                >
                  <Image
                    url={item.imageUrl ?? undefined}
                    className="w-20 h-20"
                    resizeMode="cover"
                    fallbackWidth={80}
                    fallbackHeight={80}
                    fallbackLogoSize={26}
                  />
                  <View className="flex-1 px-3 py-2">
                    <Text className="font-urbanist-bold text-text-primary" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-sm font-urbanist-bold text-accent mt-0.5">
                      {priceLabel(item.price * item.quantity)}
                      {item.weightGrams ? (
                        <Text className="text-xs font-urbanist text-text-tertiary">
                          {`  ·  ${item.weightGrams} g`}
                        </Text>
                      ) : null}
                    </Text>
                    {item.boxSelections && item.boxSelections.length > 0 ? (
                      <Text className="text-xs font-urbanist text-text-secondary mt-1" numberOfLines={2}>
                        {item.boxSelections
                          .map((s) => (s.quantity > 1 ? `${s.title} ×${s.quantity}` : s.title))
                          .join(', ')}
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-center pr-3">
                    <Pressable
                      className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                      onPress={() => cart.setLineQuantity(key, item.quantity - 1)}
                    >
                      <Text className="text-lg font-urbanist-bold text-text-primary">−</Text>
                    </Pressable>
                    <Text className="w-7 text-center font-urbanist-bold text-text-primary">
                      {item.quantity}
                    </Text>
                    <Pressable
                      className="w-8 h-8 rounded-full bg-accent items-center justify-center"
                      onPress={() => cart.setLineQuantity(key, item.quantity + 1)}
                    >
                      <Text className="text-lg font-urbanist-bold text-white">+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Summary + checkout */}
          <View
            className="border-t border-gray-200 px-6 pt-4"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            {/* Fulfillment choice: delivery vs collect-at-spot */}
            <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-4">
              {(['delivery', 'pickup'] as const).map((type) => {
                const active = cart.fulfillmentType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => cart.setFulfillmentType(type)}
                    className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
                    style={{ backgroundColor: active ? '#fff' : 'transparent' }}
                  >
                    <Ionicons
                      name={type === 'delivery' ? 'bicycle-outline' : 'storefront-outline'}
                      size={18}
                      color={active ? '#EC2828' : '#6B7280'}
                    />
                    <Text
                      className="ml-2 font-urbanist-bold"
                      style={{ color: active ? '#EC2828' : '#6B7280' }}
                    >
                      {t(type === 'delivery' ? 'Ordering.delivery' : 'Ordering.pickup')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="font-urbanist text-text-secondary">
                {t('Ordering.cartTotal', { count: cart.count })}
              </Text>
              <Text className="font-urbanist-bold text-text-primary text-lg">
                {priceLabel(cart.subtotal)}
              </Text>
            </View>
            <Pressable
              className="bg-accent rounded-2xl py-4 items-center"
              onPress={() =>
                router.push(cart.fulfillmentType === 'pickup' ? '/order/details' : '/order/address')
              }
            >
              <Text className="text-white font-urbanist-bold text-base">
                {t('Ordering.checkout')} · {priceLabel(cart.subtotal)}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
