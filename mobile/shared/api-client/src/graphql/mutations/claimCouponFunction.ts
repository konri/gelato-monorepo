import { executeGraphQLQuery } from '../client';
import { CLAIM_COUPON_MUTATION } from './claimCoupon';
import { ClaimCouponResponse, ClaimCouponOptions } from './claimCouponTypes';

export const claimCoupon = async (options: ClaimCouponOptions) => {
  const { couponId, token } = options;

  const result = await executeGraphQLQuery<ClaimCouponResponse>(CLAIM_COUPON_MUTATION, {
    token,
    variables: { couponId }
  });

  return {
    ...result,
    data: result.data ? result.data.claimCoupon : null
  };
};