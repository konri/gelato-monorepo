import { COLORS, LText } from '@/components/molecules/Loyalty/ui';
import type { LoyaltyWallet } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { formatNumber, pointsText } from '@/utils/formatPoints';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * The selected brand's spendable points as the big number (56px, capped at
 * 1.3× text size), plus the rule line: points are spent only where they were
 * collected (A4).
 */
export function WalletPoints({ wallet }: { wallet: LoyaltyWallet }) {
  const { t } = useTranslation();
  const points = wallet.availablePoints;
  return (
    <View
      className="mx-4 mt-3 rounded-3xl border border-gray-200 bg-white p-4"
      accessible
      accessibilityLabel={`${t('Prizes.yourPointsAt', { brand: wallet.brand.name })}: ${pointsText(t, points)}. ${t(
        'Loyalty.ruleLine',
        { brand: wallet.brand.name },
      )}`}
    >
      <LText size={18} color={COLORS.secondary}>
        {t('Prizes.yourPointsAt', { brand: wallet.brand.name })}
      </LText>
      <View className="flex-row flex-wrap items-baseline">
        <LText size={56} lineHeight={64} weight="700" color={COLORS.red} max={1.3}>
          {formatNumber(points)}
        </LText>
        <LText size={20} weight="600" className="ml-2" max={1.3}>
          {t('Loyalty.pointsUnit', { count: points })}
        </LText>
      </View>
      <LText size={16} color={COLORS.secondary} className="mt-1">
        {t('Loyalty.ruleLine', { brand: wallet.brand.name })}
      </LText>
    </View>
  );
}
