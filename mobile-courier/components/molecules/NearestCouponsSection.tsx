import React from 'react';
import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';
import { nearbyCouponStrategy } from '@/components/molecules/CouponSection/strategies';
import { CouponSectionWithModal } from '@/components/molecules/CouponSectionWithModal';

export function NearestCouponsSection() {
  return (
    <CouponSectionWithModal
      titleKey="Sections.nearestCoupons"
      displayType={CouponDisplayType.STANDARD}
      strategy={nearbyCouponStrategy}
      showPagination
      autoScroll
      radiusKm={50}
      bulletsColor="#EA3A1D"
    />
  );
}
