import { getMyPointBalance, PointBalance } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const usePointBalance = () => {
  return useGraphQLQuery<PointBalance>(
    getMyPointBalance,
    {},
    []
  );
};
