import { gql } from "@apollo/client";
import { COUPON_FIELDS_FRAGMENT } from "../../fragments/coupon";

export const GET_MY_MERCHANT_COUPONS_QUERY = gql`
  ${COUPON_FIELDS_FRAGMENT}
  query GetMyMerchantCoupons($storeId: String) {
    myMerchantCoupons(storeId: $storeId) {
      ...CouponFields
    }
  }
`;
