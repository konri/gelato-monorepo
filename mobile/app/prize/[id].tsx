import { BrandLogo } from '@/components/atoms/BrandLogo';
import { Image } from '@/components/atoms/Image';
import { BackHeader, COLORS, EmptyState, LText, PrimaryButton } from '@/components/molecules/Loyalty/ui';
import { ConfirmRedeemSheet } from '@/components/molecules/Rewards/ConfirmRedeemSheet';
import { rewardStatus } from '@/components/molecules/Rewards/RewardRow';
import { useBrands } from '@/hooks/useBrands';
import { brandRewardsKey, refreshQuery, useBrandBalance, usePrizeDetail } from '@/hooks/useRewards';
import type { UserPrize } from '@/shared/api-client/src/graphql/queries/prizes/types';
import { pointsText } from '@/utils/formatPoints';
import { localizedText } from '@/utils/localizedText';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Reward detail (BRANDS_SPEC §5.5). The brand comes from the reward and the
 * points from THAT brand's wallet (`useBrandBalance(prize.brandId)`), never
 * from the selected brand: a deep link to another brand's reward stays right.
 * Opening a reward never changes the persisted brand selection.
 */
export default function PrizeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: prize, loading, error, refetch } = usePrizeDetail(id ?? null);
  const balance = useBrandBalance(prize?.brandId ?? null);
  const { refresh } = useBrands();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading && !prize) {
    return (
      <View className="flex-1 bg-white">
        <BackHeader topInset={insets.top} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  if (!prize) {
    return (
      <View className="flex-1 bg-gray-50">
        <BackHeader topInset={insets.top} />
        {error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t('Prizes.loadFailed')}
            action={{ label: t('Loyalty.retry'), onPress: () => void refetch(), secondary: true }}
          />
        ) : (
          <EmptyState icon="gift-outline" title={t('Prizes.noLongerAvailable')} />
        )}
      </View>
    );
  }

  const lang = i18n.language;
  const title = localizedText(prize.titleLocal, lang) || prize.title;
  const description = localizedText(prize.descriptionLocal, lang) || prize.description || '';
  const brandName = prize.brand.name;
  const brandPaused = !prize.brand.isActive || balance.paused;
  const noLonger = !!prize.archivedAt || !prize.isActive || brandPaused;
  const status = rewardStatus(prize, balance.points, brandPaused);
  const canClaim = status.kind === 'affordable' && !balance.loading;

  const onClaimed = (claimed: UserPrize) => {
    setConfirmOpen(false);
    refreshQuery(brandRewardsKey(prize.brandId));
    void refresh({ maxAgeMs: 0 });
    router.replace(`/prize/mine/${claimed.id}?fresh=1` as never);
  };

  const onStale = () => {
    refreshQuery(brandRewardsKey(prize.brandId));
    void refetch();
    void refresh({ maxAgeMs: 0 });
  };

  return (
    <View className="flex-1 bg-white">
      <BackHeader topInset={insets.top} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <Image
          url={prize.imageUrl ?? undefined}
          resizeMode="cover"
          style={{ width: '100%', height: 220 }}
          fallbackLogoSize={72}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />

        <View className="px-4 pt-4">
          <LText size={28} lineHeight={34} weight="700" accessibilityRole="header" max={1.3}>
            {title}
          </LText>
          <LText size={22} weight="700" color={COLORS.red} className="mt-1" max={1.3}>
            {pointsText(t, prize.pointsCost)}
          </LText>

          <Pressable
            onPress={() => router.push(`/brand/${prize.brandId}` as never)}
            accessibilityRole="button"
            accessibilityLabel={t('Prizes.validAtBrand', { brand: brandName })}
            className="mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3 active:opacity-80"
            style={{ minHeight: 64 }}
          >
            <BrandLogo brand={prize.brand} size={40} />
            <LText size={18} weight="600" className="ml-3 flex-1">
              {t('Prizes.validAtBrand', { brand: brandName })}
            </LText>
            <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
          </Pressable>

          {noLonger ? (
            <View className="mt-3 flex-row items-start rounded-2xl bg-gray-100 p-3">
              <Ionicons name="remove-circle-outline" size={22} color={COLORS.secondary} style={{ marginTop: 1 }} />
              <LText size={18} weight="600" color={COLORS.secondary} className="ml-2 flex-1">
                {brandPaused
                  ? t('Brand.pausedTitle', { brand: brandName })
                  : t('Prizes.noLongerAvailable')}
              </LText>
            </View>
          ) : (
            <View className="mt-3 rounded-2xl bg-gray-50 p-3">
              <LText size={18} weight="600">
                {balance.loading
                  ? t('Common.loading')
                  : t('Prizes.youHave', { pointsText: pointsText(t, balance.points), brand: brandName })}
              </LText>
              {status.kind === 'missing' ? (
                <View className="mt-2">
                  <View className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <View
                      className="h-3 rounded-full"
                      style={{ width: `${Math.round(status.progress * 100)}%`, backgroundColor: COLORS.accent }}
                    />
                  </View>
                  <LText size={18} color="#374151" className="mt-1">
                    {t('Prizes.morePoints', { count: status.missing })}
                  </LText>
                </View>
              ) : status.kind === 'unavailable' ? (
                <LText size={18} color={COLORS.secondary} className="mt-1">
                  {t('Prizes.notAvailableNow')}
                </LText>
              ) : null}
            </View>
          )}

          {description ? (
            <LText size={18} lineHeight={26} color="#374151" className="mt-4">
              {description}
            </LText>
          ) : null}

          <LText size={16} color={COLORS.secondary} className="mt-4">
            {t('Loyalty.ruleLine', { brand: brandName })}
          </LText>
          {!noLonger ? (
            <LText size={16} color={COLORS.secondary} className="mt-2">
              {t('Prizes.counterHint')}
            </LText>
          ) : null}
        </View>
      </ScrollView>

      {noLonger ? null : (
        <View className="border-t border-gray-200 bg-white px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          {status.kind === 'affordable' && !balance.loading ? (
            <LText size={16} color={COLORS.secondary} className="mb-2 text-center">
              {t('Prizes.confirmLeft', { leftText: pointsText(t, Math.max(0, balance.points - prize.pointsCost)) })}
            </LText>
          ) : null}
          <PrimaryButton
            label={
              balance.loading
                ? t('Common.loading')
                : status.kind === 'affordable'
                  ? t('Prizes.getIt')
                  : status.kind === 'missing'
                    ? t('Prizes.notEnough')
                    : t('Prizes.notAvailableNow')
            }
            icon={canClaim ? 'gift' : undefined}
            disabled={!canClaim}
            onPress={() => setConfirmOpen(true)}
          />
        </View>
      )}

      <ConfirmRedeemSheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        reward={{ id: prize.id, title, pointsCost: prize.pointsCost }}
        brandName={brandName}
        points={balance.points}
        onSuccess={onClaimed}
        onStale={onStale}
      />
    </View>
  );
}
