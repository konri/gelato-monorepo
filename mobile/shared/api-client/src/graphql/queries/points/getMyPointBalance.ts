import { createGraphQLFunction, GraphQLOptions } from '../../client';
import { GraphQLResult } from '../../types';
import { GET_MY_POINT_BALANCE_QUERY } from './query';
import { GetMyPointBalanceResponse, PointBalance } from './types';

const myPointBalanceFn = createGraphQLFunction<GetMyPointBalanceResponse, PointBalance | null>(
  GET_MY_POINT_BALANCE_QUERY,
  (data) => data.myPointBalance,
  'Failed to load point balance',
);

/** One brand's wallet (null: no wallet there yet, i.e. 0 points). Fallback only. */
export const getMyPointBalance = (
  brandId: string,
  options: Omit<GraphQLOptions, 'variables'> = {},
): Promise<GraphQLResult<PointBalance | null>> =>
  myPointBalanceFn({ ...options, variables: { brandId } });
