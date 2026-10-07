import { ApolloServerConfig } from '../../types';

export type ReferralCode = {
  id: string;
  code: string;
  createdAt: string;
};

export type GetMyReferralCodeOptions = ApolloServerConfig;

export type GetMyReferralCodeResponse = {
  myReferralCode: ReferralCode;
};

export type ReferralBrandEarnings = {
  brandId: string;
  brandName: string;
  points: number;
  referrals: number;
};

export type ReferralStats = {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  closedReferrals: number;
  totalPointsEarned: number;
  earnedByBrand: ReferralBrandEarnings[];
};

export type GetMyReferralStatsResponse = {
  myReferralStats: ReferralStats;
};
