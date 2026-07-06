import { executeGraphQLQuery } from '../client';
import { UNCLAIM_COUPON_MUTATION } from './unclaimCoupon';

export interface UnclaimCouponOptions {
  couponId: string;
  token: string;
}

export interface UnclaimCouponResponse {
  unclaimCoupon: boolean;
}

export const unclaimCoupon = async (options: UnclaimCouponOptions) => {
  const { couponId, token } = options;

  const result = await executeGraphQLQuery<UnclaimCouponResponse>(UNCLAIM_COUPON_MUTATION, {
    token,
    variables: { couponId }
  });

  return {
    ...result,
    data: result.data ? result.data.unclaimCoupon : null
  };
};