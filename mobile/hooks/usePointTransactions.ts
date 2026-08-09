import { getMyPointTransactions, PointTransaction } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

export const usePointTransactions = (limit: number = 50) => {
  return useGraphQLQuery<PointTransaction[]>(
    getMyPointTransactions,
    { variables: { limit } },
    [limit]
  );
};
