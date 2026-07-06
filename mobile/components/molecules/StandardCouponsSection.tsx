import React from 'react';
import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';
import { standardCouponStrategy } from '@/components/molecules/CouponSection/strategies';
import { CouponSectionWithModal } from '@/components/molecules/CouponSectionWithModal';

export function StandardCouponsSection() {
    return (
        <CouponSectionWithModal
            titleKey="Sections.standardCoupons"
            displayType={CouponDisplayType.STANDARD}
            strategy={standardCouponStrategy}
            itemWidthMode="two-columns"
            radiusKm={50}
        />
    );
}
