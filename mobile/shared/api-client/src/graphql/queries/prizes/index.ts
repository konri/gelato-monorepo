import { createGraphQLFunction, GraphQLOptions } from '../../client';
import { GraphQLResult } from '../../types';
import { MY_PRIZE_QUERY, MY_PRIZES_QUERY, PRIZE_DETAIL_QUERY } from './query';
import {
  MyPrizeResponse,
  MyPrizesResponse,
  MyPrizesVariables,
  Prize,
  PrizeDetailResponse,
  UserPrize,
} from './types';

export * from './types';
export { REWARD_BRAND_FIELDS, USER_PRIZE_FIELDS } from './query';

type Options = Omit<GraphQLOptions, 'variables'>;

const myPrizesFn = createGraphQLFunction<MyPrizesResponse, UserPrize[]>(
  MY_PRIZES_QUERY,
  (data) => data.myPrizes,
  'Failed to load your rewards',
);

/** Claimed rewards of every brand (or one brand), newest first. */
export const getMyPrizes = (
  variables: MyPrizesVariables = {},
  options: Options = {},
): Promise<GraphQLResult<UserPrize[]>> =>
  myPrizesFn({ ...options, variables: { includeRedeemed: true, ...variables } });

const myPrizeFn = createGraphQLFunction<MyPrizeResponse, UserPrize | null>(
  MY_PRIZE_QUERY,
  (data) => data.myPrize,
  'Failed to load your reward',
);

export const getMyPrize = (id: string, options: Options = {}): Promise<GraphQLResult<UserPrize | null>> =>
  myPrizeFn({ ...options, variables: { id } });

const prizeDetailFn = createGraphQLFunction<PrizeDetailResponse, Prize | null>(
  PRIZE_DETAIL_QUERY,
  (data) => data.prize,
  'Failed to load reward',
);

export const getPrizeById = (id: string, options: Options = {}): Promise<GraphQLResult<Prize | null>> =>
  prizeDetailFn({ ...options, variables: { id } });
