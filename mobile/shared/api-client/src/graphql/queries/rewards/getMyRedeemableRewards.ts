import { createGraphQLFunction } from '../../client';
import { MY_REDEEMABLE_REWARDS_QUERY } from './query';
import { MyRedeemableRewardsResponse, MyRedeemableReward } from './types';

export const getMyRedeemableRewards = createGraphQLFunction<MyRedeemableRewardsResponse, MyRedeemableReward[]>(
  MY_REDEEMABLE_REWARDS_QUERY,
  (response) => response.myRedeemableRewards,
  'Failed to fetch redeemable rewards'
);
