import { createGraphQLFunction } from '../../client';
import { GET_MY_POINT_TRANSACTIONS_QUERY } from './query';
import { GetMyPointTransactionsResponse, PointTransaction } from './types';

export const getMyPointTransactions = createGraphQLFunction<
  GetMyPointTransactionsResponse,
  PointTransaction[]
>(
  GET_MY_POINT_TRANSACTIONS_QUERY,
  data => data.myPointTransactions,
  'Failed to load points history',
);
