import { Image } from '@/components/atoms/Image';
import { usePointBalance } from '@/hooks/usePointBalance';
import { usePrizeDetail, useRedeemPrize } from '@/hooks/usePrizes';
import type { LocalizedText } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrizeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: prize, loading } = usePrizeDetail(id ?? null);
  const { data: balance, refetch: refetchBalance } = usePointBalance();
  const { redeem, redeeming } = useRedeemPrize();

  const points = balance?.availablePoints ?? 0;

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
  if (!prize) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="font-urbanist text-text-secondary">{t('Common.error')}</Text>
      </View>
    );
  }

  const title = localized(prize.titleLocal, prize.title);
  const description = localized(prize.descriptionLocal, prize.description);
  const affordable = points >= prize.pointsCost;
  const outOfStock = prize.quantity != null && prize.claimed >= prize.quantity;
  const pointsLeft = points - prize.pointsCost;
  const canRedeem = affordable && !outOfStock && !redeeming;

  const onActivate = async () => {
    const res = await redeem(prize.id);
    if (res.success && res.data) {
      await refetchBalance();
      Alert.alert(t('Prizes.successTitle'), t('Prizes.successBody'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert(t('Prizes.redeemFailed'), res.error?.message ?? '');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="relative">
          <Image url={prize.imageUrl ?? undefined} className="w-full h-72" resizeMode="cover" fallbackLogoSize={72} />
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
          <View className="flex-row items-center mt-2">
            <View className="bg-accent/10 rounded-full px-3 py-1">
              <Text className="text-sm font-urbanist-bold text-accent">
                {t('Prizes.cost', { count: prize.pointsCost })}
              </Text>
            </View>
            {outOfStock ? (
              <Text className="ml-3 font-urbanist text-text-tertiary text-sm">
                {t('Prizes.outOfStock')}
              </Text>
            ) : null}
          </View>

          {description ? (
            <Text className="text-base font-urbanist text-text-secondary mt-4 leading-6">
              {description}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Activate bar */}
      <View className="border-t border-gray-200 bg-white px-6 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        {/* Eligibility line */}
        {affordable ? (
          <Text className="text-xs font-urbanist text-text-secondary text-center mb-2">
            {t('Prizes.pointsLeftAfter', { count: pointsLeft })}
          </Text>
        ) : (
          <Text className="text-xs font-urbanist text-accent text-center mb-2">
            {t('Prizes.needMore', { count: prize.pointsCost - points })}
          </Text>
        )}
        <Pressable
          disabled={!canRedeem}
          className={`rounded-2xl py-4 items-center ${canRedeem ? 'bg-accent' : 'bg-gray-200'}`}
          onPress={onActivate}
        >
          {redeeming ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-urbanist-bold text-base ${canRedeem ? 'text-white' : 'text-text-tertiary'}`}>
              {outOfStock
                ? t('Prizes.outOfStock')
                : affordable
                  ? t('Prizes.activate')
                  : t('Prizes.notEnough')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
