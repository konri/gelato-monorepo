import type { Coupon } from "../../mutations/coupon/types";

export type GetMyMerchantCouponsResponse = {
  myMerchantCoupons: Coupon[];
};

export type GetMyMerchantCouponsVariables = {
  storeId?: string;
};
