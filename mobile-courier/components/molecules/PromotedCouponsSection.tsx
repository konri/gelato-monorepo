import { promotedCouponStrategy } from '@/components/molecules/CouponSection/strategies';
import { CouponSectionWithModal } from '@/components/molecules/CouponSectionWithModal';
import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';
import { router } from 'expo-router';
import React from 'react';

export function PromotedCouponsSection() {
  return (
    <CouponSectionWithModal
      titleKey="Sections.promotedCoupons"
      displayType={CouponDisplayType.PROMOTED}
      strategy={promotedCouponStrategy}
      radiusKm={50}
      onSeeAllPress={() => router.push('/see-all-coupons/promoted')}
    />
  );
}
