import { executeGraphQLQuery } from '../../client';
import { MY_COUPONS_QUERY } from './query';
import { MyCouponsResponse, MyCoupon } from './types';

export const getMyCoupons = async (options?: { token?: string }) => {
  const result = await executeGraphQLQuery<MyCouponsResponse>(MY_COUPONS_QUERY, {
    token: options?.token
  });

  return {
    ...result,
    data: result.data ? result.data.myCoupons : null
  };
};