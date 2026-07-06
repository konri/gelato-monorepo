import { createGraphQLFunction } from '../../client';
import { GET_MY_REFERRAL_CODE_QUERY } from './query';
import { GetMyReferralCodeResponse, ReferralCode } from './types';

export const getMyReferralCode = createGraphQLFunction<GetMyReferralCodeResponse, ReferralCode>(
  GET_MY_REFERRAL_CODE_QUERY,
  data => data.myReferralCode,
  'Failed to load referral code',
);
