import { Image } from '@/components/atoms/Image';
import { BoxSelection } from '@/hooks/useCart';
import { useSpotTastes } from '@/hooks/useTastes';
import type { Product } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const zl = (n: number) => `${n.toFixed(2).replace(/\.00$/, '')} zł`;

/**
 * Modal to pick the tastes for a box product. Total picked scoops are capped
 * at product.maxTastes; a taste can be chosen more than once.
 */
export const BoxPickerModal = ({
  product,
  visible,
  onClose,
  onConfirm,
}: {
  product: Product;
  visible: boolean;
  onClose: () => void;
  onConfirm: (selections: BoxSelection[]) => void;
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: tastes, loading } = useSpotTastes(visible ? product.spotId : null);
  const max = product.maxTastes ?? 0;

  // tasteId -> quantity
  const [picked, setPicked] = useState<Record<string, number>>({});
  const total = useMemo(() => Object.values(picked).reduce((s, n) => s + n, 0), [picked]);
  const remaining = max - total;

  const inc = (id: string) => {
    if (remaining <= 0) return;
    setPicked((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  };
  const dec = (id: string) =>
    setPicked((p) => {
      const next = { ...p };
      const v = (next[id] ?? 0) - 1;
      if (v <= 0) delete next[id];
      else next[id] = v;
      return next;
    });

  const confirm = () => {
    const selections: BoxSelection[] = (tastes ?? [])
      .filter((tt) => picked[tt.id])
      .map((tt) => ({ tasteId: tt.id, title: tt.title, quantity: picked[tt.id] }));
    onConfirm(selections);
    setPicked({});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%', paddingBottom: insets.bottom + 12 }}>
          {/* Header */}
          <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-gray-100">
            <View className="flex-1">
              <Text className="text-lg font-urbanist-bold text-text-primary" numberOfLines={1}>
                {product.name}
              </Text>
              <Text className="text-xs font-urbanist text-text-secondary mt-0.5">
                {t('Ordering.box.pickUpTo', { max })}
                {product.weightGrams ? ` · ${product.weightGrams} g` : ''}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#212121" />
            </Pressable>
          </View>

          {/* Remaining counter */}
          <View className="px-5 py-2 bg-background-secondary">
            <Text className="font-urbanist-semibold text-text-primary">
              {remaining > 0
                ? t('Ordering.box.remaining', { count: remaining })
                : t('Ordering.box.full')}
            </Text>
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#EC2828" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {(tastes ?? []).map((tt) => {
                const qty = picked[tt.id] ?? 0;
                return (
                  <View
                    key={tt.id}
                    className="flex-row items-center mb-3 bg-white rounded-2xl border border-gray-200 overflow-hidden"
                  >
                    <Image
                      url={tt.imageUrl ?? undefined}
                      className="w-16 h-16"
                      resizeMode="cover"
                      fallbackWidth={64}
                      fallbackHeight={64}
                      fallbackLogoSize={22}
                    />
                    <View className="flex-1 px-3">
                      <Text className="font-urbanist-bold text-text-primary" numberOfLines={1}>
                        {tt.title}
                      </Text>
                      {tt.subtitle ? (
                        <Text className="text-xs font-urbanist text-text-secondary" numberOfLines={1}>
                          {tt.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row items-center pr-3">
                      {qty > 0 ? (
                        <>
                          <Pressable
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            onPress={() => dec(tt.id)}
                          >
                            <Text className="text-lg font-urbanist-bold text-text-primary">−</Text>
                          </Pressable>
                          <Text className="w-7 text-center font-urbanist-bold text-text-primary">{qty}</Text>
                        </>
                      ) : null}
                      <Pressable
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          remaining <= 0 ? 'bg-gray-200' : 'bg-accent'
                        }`}
                        onPress={() => inc(tt.id)}
                        disabled={remaining <= 0}
                      >
                        <Text className="text-lg font-urbanist-bold text-white">+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Confirm */}
          <View className="px-5 pt-2">
            <Pressable
              disabled={total === 0}
              className={`rounded-2xl py-4 items-center ${total === 0 ? 'bg-gray-200' : 'bg-accent'}`}
              onPress={confirm}
            >
              <Text className={`font-urbanist-bold text-base ${total === 0 ? 'text-text-tertiary' : 'text-white'}`}>
                {t('Ordering.box.addToCart', { count: total })} · {zl(product.price)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
