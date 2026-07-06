import { getMyReferralCode, ReferralCode } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const useReferralCode = () => {
  return useGraphQLQuery<ReferralCode>(
    getMyReferralCode,
    {},
    []
  );
};