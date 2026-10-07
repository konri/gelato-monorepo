import { createGraphQLFunction, GraphQLOptions } from '../../client';
import { GraphQLResult } from '../../types';
import { GET_MY_POINT_TRANSACTIONS_QUERY } from './query';
import { GetMyPointTransactionsResponse, PointTransaction } from './types';

const myPointTransactionsFn = createGraphQLFunction<GetMyPointTransactionsResponse, PointTransaction[]>(
  GET_MY_POINT_TRANSACTIONS_QUERY,
  (data) => data.myPointTransactions,
  'Failed to load points history',
);

/** Ledger rows, newest first; one brand with `brandId`. */
export const getMyPointTransactions = (
  variables: { limit?: number; brandId?: string | null } = {},
  options: Omit<GraphQLOptions, 'variables'> = {},
): Promise<GraphQLResult<PointTransaction[]>> =>
  myPointTransactionsFn({ ...options, variables: { limit: 50, ...variables } });
