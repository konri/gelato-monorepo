import { horizontalSliderNearbyCouponStrategy } from '@/components/molecules/CouponSection/strategies';
import { CouponSectionWithModal } from '@/components/molecules/CouponSectionWithModal';
import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';
import { router } from 'expo-router';
import React from 'react';

export function NearbyCouponsSection() {
  return (
    <CouponSectionWithModal
      titleKey="Sections.nearbyCoupons"
      displayType={CouponDisplayType.STANDARD}
      strategy={horizontalSliderNearbyCouponStrategy}
      showPagination
      autoScroll
      itemWidthMode="full-width"
      radiusKm={50}
      bulletsColor="#FF6B00"
      onSeeAllPress={() => router.push('/see-all-coupons/nearby')}
    />
  );
}
