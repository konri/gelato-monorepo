import { PromotedCoupon } from '@/shared/api-client/src/graphql/queries/coupons/types';

export const isCouponActivatable = (coupon: PromotedCoupon): boolean => {
  const now = new Date();
  const validFrom = new Date(coupon.validFrom);
  const validUntil = new Date(coupon.validUntil);
  
  return now >= validFrom && now <= validUntil;
};