import { CouponConfirmationModal } from '@/components/molecules/CouponConfirmationModal';
import { CouponSection } from '@/components/molecules/CouponSection';
import { CouponRenderStrategy } from '@/components/molecules/CouponSection/strategies';
import { CouponModalProvider, useCouponModalContext } from '@/contexts/CouponModalContext';
import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';

type ItemWidthMode = 'full-width' | 'two-columns' | number;

interface CouponSectionWithModalProps {
  titleKey: string;
  displayType: CouponDisplayType;
  strategy: CouponRenderStrategy;
  showPagination?: boolean;
  autoScroll?: boolean;
  itemWidthMode?: ItemWidthMode;
  radiusKm?: number;
  bulletsColor?: string;
  onSeeAllPress?: () => void;
}

function calculateItemWidth(mode: ItemWidthMode, screenWidth: number): number | undefined {
  if (typeof mode === 'number') return mode;
  if (mode === 'full-width') return screenWidth * 0.8;
  if (mode === 'two-columns') return (screenWidth - 48) / 2;
  return undefined;
}

function CouponSectionContent({
  titleKey,
  displayType,
  strategy,
  showPagination = false,
  autoScroll = false,
  itemWidthMode,
  radiusKm = 50,
  bulletsColor,
  onSeeAllPress,
}: CouponSectionWithModalProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { handleCouponPress } = useCouponModalContext();
  const itemWidth = itemWidthMode ? calculateItemWidth(itemWidthMode, width) : undefined;

  return (
    <>
      <CouponSection
        title={t(titleKey)}
        seeAllText={t('Sections.seeAll')}
        displayType={displayType}
        strategy={strategy}
        showPagination={showPagination}
        autoScroll={autoScroll}
        radiusKm={radiusKm}
        itemWidth={itemWidth}
        onCouponPress={handleCouponPress}
        bulletsColor={bulletsColor}
        onSeeAllPress={onSeeAllPress}
      />
      
      <CouponConfirmationModal
        strategy={strategy}
      />
    </>
  );
}

export function CouponSectionWithModal(props: CouponSectionWithModalProps) {
  return (
    <CouponModalProvider>
      <CouponSectionContent {...props} />
    </CouponModalProvider>
  );
}