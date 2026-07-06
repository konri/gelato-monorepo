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
