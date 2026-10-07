import { getMyPointTransactions, PointTransaction } from '@repo/api-client';
import { useGraphQLQuery } from './useGraphQLQuery';

/** Ledger rows, newest first: every brand, or one with `brandId` (MULTI, §5.6). */
export const usePointTransactions = (brandId?: string | null, limit: number = 50) => {
  return useGraphQLQuery<PointTransaction[]>(
    (options) => getMyPointTransactions({ limit, brandId: brandId ?? null }, options),
    {},
    [limit, brandId ?? null],
  );
};
