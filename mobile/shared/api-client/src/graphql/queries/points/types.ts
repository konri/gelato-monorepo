import { ApolloServerConfig } from '../../types';

export type PointBalance = {
  totalPoints: number;
  availablePoints: number;
  lockedPoints: number;
};

export type GetMyPointBalanceOptions = ApolloServerConfig;

export type GetMyPointBalanceResponse = {
  myPointBalance: PointBalance;
};
