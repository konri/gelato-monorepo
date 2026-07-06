import { CouponDisplayType } from '@/shared/api-client/src/graphql/queries/coupons/types';

export const COUPON_TYPE_CONFIG = {
  hot: {
    displayType: CouponDisplayType.HOT,
    titleKey: 'Sections.hotCoupons',
  },
  nearby: {
    displayType: CouponDisplayType.STANDARD,
    titleKey: 'Sections.nearbyCoupons',
  },
  promoted: {
    displayType: CouponDisplayType.PROMOTED,
    titleKey: 'Sections.promotedCoupons',
  },
} as const;

export type CouponTypeKey = keyof typeof COUPON_TYPE_CONFIG;
