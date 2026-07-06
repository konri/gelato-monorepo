import { getMerchants, GetMerchantsParams, GetMerchantsResult } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export interface UseMerchantsProps {
  params?: GetMerchantsParams;
}

export const useMerchants = ({ params = {} }: UseMerchantsProps = {}) => {
  return useGraphQLQuery<GetMerchantsResult>(
    getMerchants,
    { params },
    [JSON.stringify(params)]
  );
};
