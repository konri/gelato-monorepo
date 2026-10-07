import { createGraphQLFunction } from '../../client';
import { GET_MY_REFERRAL_CODE_QUERY, GET_MY_REFERRAL_STATS_QUERY } from './query';
import {
  GetMyReferralCodeResponse,
  GetMyReferralStatsResponse,
  ReferralCode,
  ReferralStats,
} from './types';

export const getMyReferralCode = createGraphQLFunction<GetMyReferralCodeResponse, ReferralCode>(
  GET_MY_REFERRAL_CODE_QUERY,
  data => data.myReferralCode,
  'Failed to load referral code',
);

export const getMyReferralStats = createGraphQLFunction<GetMyReferralStatsResponse, ReferralStats>(
  GET_MY_REFERRAL_STATS_QUERY,
  data => data.myReferralStats,
  'Failed to load invitations',
);
