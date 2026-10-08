import type { LoyaltyWallet } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { localizedText } from '@/utils/localizedText';
import type { LoyaltyMode } from '@/utils/loyaltyMode';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { PromotionRibbon } from './PromotionRibbon';
import { THEME } from '@/constants/palette';

type Props = {
  mode: LoyaltyMode;
  wallet: LoyaltyWallet | null;
  onSeeRewards: () => void;
  onChooseCity: () => void;
};

/**
 * My card, below the code (BRANDS_SPEC §5.4 item 4): progress to the next
 * reward, the promotion, [See rewards]. In the E = 0 modes: how points are
 * collected and one next step.
 */
export function LoyaltyPointsCard({ mode, wallet, onSeeRewards, onChooseCity }: Props) {
  const { t, i18n } = useTranslation();

  if (mode.kind === 'LOADING' || mode.kind === 'ERROR') return null;

  const withBrand = mode.kind === 'SINGLE' || mode.kind === 'MULTI' || mode.kind === 'ONE_TO_DISCOVER';

  if (!withBrand || !wallet) {
    const cityAction =
      mode.kind === 'NO_CITY'
        ? t('Loyalty.chooseCity')
        : mode.kind === 'NO_BRANDS_IN_CITY'
          ? t('Loyalty.changeCity')
          : null;
    return (
      <Card>
        <HowTo text={t('Loyalty.howToEarn')} />
        {cityAction ? (
          <SecondaryButton label={cityAction} onPress={onChooseCity} />
        ) : (
          <PrimaryButton label={t('Loyalty.seeRewards')} onPress={onSeeRewards} />
        )}
      </Card>
    );
  }

  const available = wallet.availablePoints;
  const next = wallet.nextReward;
  const missing = wallet.pointsToNextReward ?? (next ? Math.max(0, next.pointsCost - available) : 0);
  const progress = next && next.pointsCost > 0 ? Math.min(1, available / next.pointsCost) : 0;
  const rewardName = next ? localizedText(next.titleLocal, i18n.language) || next.title : '';

  return (
    <Card>
      {mode.kind === 'ONE_TO_DISCOVER' ? (
        <View className="mb-3">
          <HowTo text={t('Loyalty.howToEarn')} />
        </View>
      ) : null}
      {wallet.affordableRewardCount > 0 ? (
        <View className="flex-row items-center" accessible>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="checkmark" size={22} color="#166534" />
          </View>
          <Text
            className="ml-2 flex-1 font-urbanist"
            style={{ fontSize: 18, lineHeight: 24, fontWeight: '700', color: '#166534' }}
            maxFontSizeMultiplier={1.5}
          >
            {t('Loyalty.canGetNow')}
          </Text>
        </View>
      ) : next && missing > 0 ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: next.pointsCost, now: Math.min(available, next.pointsCost) }}
        >
          <View className="h-3 overflow-hidden rounded-full bg-gray-200">
            <View className="h-3 rounded-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
          </View>
          <Text
            className="mt-2 font-urbanist text-gray-900"
            style={{ fontSize: 18, lineHeight: 24 }}
            maxFontSizeMultiplier={1.5}
          >
            {t('Loyalty.nextReward', { count: missing, reward: rewardName })}
          </Text>
        </View>
      ) : null}

      {wallet.activePromotion ? <PromotionRibbon promotion={wallet.activePromotion} /> : null}

      <PrimaryButton label={t('Loyalty.seeRewards')} onPress={onSeeRewards} />
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="mx-4 mt-3 rounded-3xl border border-gray-200 bg-white p-4">{children}</View>;
}

function HowTo({ text }: { text: string }) {
  return (
    <View className="flex-row items-start">
      <Ionicons name="information-circle-outline" size={24} color={THEME.textSecondary} />
      <Text
        className="ml-2 flex-1 font-urbanist"
        style={{ fontSize: 18, lineHeight: 25, color: THEME.text }}
        maxFontSizeMultiplier={1.5}
      >
        {text}
      </Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mt-4 items-center justify-center rounded-2xl bg-accent px-4 active:opacity-80"
      style={{ minHeight: 56 }}
    >
      <Text className="font-urbanist text-white" style={{ fontSize: 18, fontWeight: '700' }} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mt-4 items-center justify-center rounded-2xl border-2 border-gray-300 bg-white px-4 active:opacity-80"
      style={{ minHeight: 56 }}
    >
      <Text
        className="font-urbanist text-gray-900"
        style={{ fontSize: 18, fontWeight: '700' }}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
    </Pressable>
  );
}
