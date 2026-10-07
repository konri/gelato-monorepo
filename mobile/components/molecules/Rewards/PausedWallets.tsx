import { BrandLogo } from '@/components/atoms/BrandLogo';
import { COLORS, LText, SectionTitle } from '@/components/molecules/Loyalty/ui';
import type { LoyaltyWallet } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { pointsText } from '@/utils/formatPoints';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Wallets of paused brands (BRANDS_SPEC §5.3, E14), greyed: nothing can be
 * collected or spent there, the points are kept.
 */
export function PausedWallets({ wallets }: { wallets: LoyaltyWallet[] }) {
  const { t } = useTranslation();
  const shown = wallets.filter((w) => w.paused && (w.hasWallet || w.availablePoints > 0));
  if (shown.length === 0) return null;
  return (
    <View>
      <SectionTitle text={t('Loyalty.pickerPaused')} />
      {shown.map((w) => {
        const text = t('Brand.pausedLine', { brand: w.brand.name, pointsText: pointsText(t, w.availablePoints) });
        return (
          <View
            key={w.brand.id}
            className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 p-3"
            style={{ minHeight: 72 }}
            accessible
            accessibilityLabel={text}
          >
            <BrandLogo brand={w.brand} size={48} muted />
            <LText size={18} color={COLORS.secondary} className="ml-3 flex-1">
              {text}
            </LText>
          </View>
        );
      })}
    </View>
  );
}
