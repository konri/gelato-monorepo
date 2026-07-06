import { createGraphQLFunction } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import { MY_PRIZES_QUERY, PRIZES_QUERY, PRIZE_DETAIL_QUERY } from './query';
import {
  MyPrizesResponse,
  Prize,
  PrizeDetailResponse,
  PrizesResponse,
  UserPrize,
} from './types';

export * from './types';

export const getPrizes = createGraphQLFunction<PrizesResponse, Prize[]>(
  PRIZES_QUERY,
  data => data.prizes,
  'Failed to load prizes',
);

export const getMyPrizes = createGraphQLFunction<MyPrizesResponse, UserPrize[]>(
  MY_PRIZES_QUERY,
  data => data.myPrizes,
  'Failed to load your prizes',
);

export const getPrizeById = async (
  id: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<Prize | null>> =>
  createGraphQLFunction<PrizeDetailResponse, Prize | null>(
    PRIZE_DETAIL_QUERY,
    data => data.prize,
    'Failed to load prize',
  )({ ...options, variables: { id } });
