import { getMerchantById } from '@repo/api-client';
import type { Merchant } from '@/shared/types/merchants';
import { useGraphQLQuery } from './useGraphQLQuery';

export interface UseMerchantProps {
  id: string;
}

export const useMerchant = ({ id }: UseMerchantProps) => {
  return useGraphQLQuery<Merchant>(
    (options) => getMerchantById(id, options),
    {},
    [id]
  );
};
