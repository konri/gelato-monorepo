import { gql } from '@apollo/client';

export const UNCLAIM_COUPON_MUTATION = gql`
  mutation UnclaimCoupon($couponId: String!) {
    unclaimCoupon(couponId: $couponId)
  }
`;