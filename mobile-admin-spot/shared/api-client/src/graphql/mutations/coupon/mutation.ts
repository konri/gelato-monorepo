import { gql } from "@apollo/client";
import { COUPON_FIELDS_FRAGMENT } from "../../fragments/coupon";

export const CREATE_COUPON_MUTATION = gql`
  ${COUPON_FIELDS_FRAGMENT}
  mutation CreateCoupon($data: CreateCouponInput!, $storeId: String) {
    createCoupon(data: $data, storeId: $storeId) {
      ...CouponFields
    }
  }
`;

export const UPDATE_COUPON_MUTATION = gql`
  ${COUPON_FIELDS_FRAGMENT}
  mutation UpdateCoupon($couponId: String!, $data: UpdateCouponInput!) {
    updateCoupon(couponId: $couponId, data: $data) {
      ...CouponFields
    }
  }
`;

export const UPSERT_COUPON_STORE_OVERRIDE_MUTATION = gql`
  ${COUPON_FIELDS_FRAGMENT}
  mutation UpsertCouponStoreOverride(
    $couponId: String!
    $storeId: String!
    $data: UpsertCouponStoreOverrideInput!
  ) {
    upsertCouponStoreOverride(couponId: $couponId, storeId: $storeId, data: $data) {
      ...CouponFields
    }
  }
`;
