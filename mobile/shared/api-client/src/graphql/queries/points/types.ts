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

export type PointTransaction = {
  id: string;
  type: 'EARNED' | 'SPENT' | 'REFUND' | 'BONUS' | 'REFERRAL' | 'BIRTHDAY' | 'QUEST';
  amount: number;
  description: string;
  referenceId?: string | null;
  referenceType?: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
};

export type GetMyPointTransactionsResponse = {
  myPointTransactions: PointTransaction[];
};
