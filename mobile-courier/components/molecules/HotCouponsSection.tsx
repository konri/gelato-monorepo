import { nearbyCouponStrategy } from '@/components/molecules/CouponSection/strategies';
import { CouponSectionWithModal } from '@/components/molecules/CouponSectionWithModal';
import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';
import { useRouter } from 'expo-router';
import React from 'react';

export function HotCouponsSection() {
  const router = useRouter();

  return (
    <CouponSectionWithModal
      titleKey="Sections.hotCoupons"
      displayType={CouponDisplayType.HOT}
      strategy={nearbyCouponStrategy}
      showPagination
      autoScroll
      radiusKm={50}
      bulletsColor="#EA3A1D"
      onSeeAllPress={() => router.push('/see-all-coupons/hot')}
    />
  );
}