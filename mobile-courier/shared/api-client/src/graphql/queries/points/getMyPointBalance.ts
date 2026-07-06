import { createGraphQLFunction } from '../../client';
import { GET_MY_POINT_BALANCE_QUERY } from './query';
import { GetMyPointBalanceResponse, PointBalance } from './types';

export const getMyPointBalance = createGraphQLFunction<GetMyPointBalanceResponse, PointBalance>(
  GET_MY_POINT_BALANCE_QUERY,
  data => data.myPointBalance,
  'Failed to load point balance',
);
