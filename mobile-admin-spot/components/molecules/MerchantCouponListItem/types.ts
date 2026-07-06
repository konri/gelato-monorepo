import type { Coupon } from "@/shared/api-client/src/graphql/mutations/coupon";

export type MerchantCouponListItemProps = {
  coupon: Coupon;
  onPress?: (couponId: string) => void;
  scopeLabel?: string;
};
