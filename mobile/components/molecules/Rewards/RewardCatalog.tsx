import { COLORS, LText, SecondaryButton, SectionTitle } from '@/components/molecules/Loyalty/ui';
import { useBrandRewards } from '@/hooks/useRewards';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { RewardRow } from './RewardRow';

type Props = {
  brand: { id: string; name: string };
  /** Section title; default "Rewards · {brand}". */
  title?: string | null;
};

/** A brand's rewards on offer, cheapest first (60 s cache per brand). */
export function RewardCatalog({ brand, title }: Props) {
  const { t } = useTranslation();
  const { data, loading, error, refetch, revalidate } = useBrandRewards(brand.id);
  const rewards = data ?? [];

  // Back on screen: reload when the 60 s cache has aged out.
  useFocusEffect(
    useCallback(() => {
      void revalidate();
    }, [revalidate]),
  );

  return (
    <View>
      <SectionTitle text={title ?? t('Prizes.catalogTitle', { brand: brand.name })} />
      {loading && !data ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : error && !data ? (
        <View className="mx-4 mt-3 rounded-2xl border border-gray-200 bg-white p-4">
          <LText size={18} color={COLORS.secondary}>
            {t('Prizes.catalogFailed')}
          </LText>
          <View className="mt-3">
            <SecondaryButton label={t('Loyalty.retry')} icon="refresh" onPress={() => void refetch()} />
          </View>
        </View>
      ) : rewards.length === 0 ? (
        <View className="mx-4 mt-3 rounded-2xl border border-gray-200 bg-white p-4">
          <LText size={18} color={COLORS.secondary}>
            {t('Prizes.catalogEmpty', { brand: brand.name })}
          </LText>
        </View>
      ) : (
        rewards.map((reward) => (
          <RewardRow key={reward.id} reward={reward} onPress={() => router.push(`/prize/${reward.id}` as never)} />
        ))
      )}
    </View>
  );
}

function SkeletonRow() {
  return (
    <View
      className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-3"
      style={{ minHeight: 96 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="rounded-2xl bg-gray-200" style={{ width: 72, height: 72 }} />
      <View className="ml-3 flex-1">
        <View className="h-5 w-3/4 rounded bg-gray-200" />
        <View className="mt-2 h-5 w-1/3 rounded bg-gray-200" />
      </View>
    </View>
  );
}
