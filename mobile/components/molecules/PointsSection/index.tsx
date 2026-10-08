import { BrandLogo } from '@/components/atoms/BrandLogo';
import { COLORS, LText } from '@/components/molecules/Loyalty/ui';
import { useBrands } from '@/hooks/useBrands';
import { formatNumber, pointsText } from '@/utils/formatPoints';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Settings pill (BRANDS_SPEC §5.6): the selected brand's logo and points.
 * Hidden when nothing is engaged (no points and no reward to pick up).
 */
export const PointsSection = ({ variant = 'default' }: { variant?: 'default' | 'small' }) => {
  const { t } = useTranslation();
  const { mode, selectedWallet } = useBrands();
  if ((mode.kind !== 'SINGLE' && mode.kind !== 'MULTI') || !selectedWallet) return null;

  const small = variant === 'small';
  const points = selectedWallet.availablePoints;
  return (
    <View
      className="flex-row items-center self-start rounded-full border border-berry-pale bg-berry-wash pl-1 pr-3"
      style={{ minHeight: small ? 36 : 44 }}
      accessible
      accessibilityLabel={`${selectedWallet.brand.name}, ${pointsText(t, points)}`}
    >
      <BrandLogo brand={selectedWallet.brand} size={small ? 28 : 36} />
      <LText size={small ? 16 : 18} weight="700" color={COLORS.brand} className="ml-2" max={1.3}>
        {formatNumber(points)}
      </LText>
      <LText size={16} color={COLORS.secondary} className="ml-1" max={1.3}>
        {t('Loyalty.pointsUnit', { count: points })}
      </LText>
    </View>
  );
};
