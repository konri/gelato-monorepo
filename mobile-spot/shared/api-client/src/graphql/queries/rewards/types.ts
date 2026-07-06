import { ApolloServerConfig } from '../../types';
import { ActivityType } from '../stores/types';

export type MyRedeemableReward = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  pointsCost?: number;
  userPoints?: number;
  pointsNeeded?: number;
  stampsCollected?: number;
  stampsRequired?: number;
  stampsNeeded?: number;
  canRedeem: boolean;
  stampCoverUrl?: string;
  stampStickerIconUrl?: string;
  imageUrl?: string;
  merchant?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  store?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
};

export type MyRedeemableRewardsResponse = {
  myRedeemableRewards: MyRedeemableReward[];
};

export type MyRedeemableRewardsOptions = ApolloServerConfig;
