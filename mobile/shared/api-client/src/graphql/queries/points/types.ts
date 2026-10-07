import { ApolloServerConfig } from '../../types';

export type PointBalance = {
  brandId?: string;
  totalPoints: number;
  availablePoints: number;
  lockedPoints: number;
};

export type GetMyPointBalanceOptions = ApolloServerConfig;

export type GetMyPointBalanceResponse = {
  myPointBalance: PointBalance | null;
};

/** What produced a ledger row (schema.gql `LedgerSource`). */
export type LedgerSource =
  | 'ORDER'
  | 'ORDER_APOLOGY'
  | 'ORDER_REVERSAL'
  | 'STAFF_TEMPLATE'
  | 'STAFF_CUSTOM'
  | 'REFERRAL_REFERRER'
  | 'REFERRAL_REFEREE'
  | 'BIRTHDAY'
  | 'PRIZE_CLAIM'
  | 'PRIZE_REFUND'
  | 'ADMIN_ADJUSTMENT';

export type PointTransaction = {
  id: string;
  type: 'EARNED' | 'SPENT' | 'REFUND' | 'BONUS' | 'REFERRAL' | 'BIRTHDAY' | 'QUEST';
  /** Unknown to this build when the server adds a value: show `description`. */
  source?: LedgerSource | string | null;
  /** Signed: a debit (reward claim) is negative. */
  amount: number;
  basePoints?: number | null;
  /** 100 = no promotion; 200 = double points. */
  multiplierPercent: number;
  description: string;
  referenceId?: string | null;
  referenceType?: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  brandId: string;
  brand: { id: string; name: string; logoUrl?: string | null };
  spot?: { id: string; name: string } | null;
};

export type GetMyPointTransactionsResponse = {
  myPointTransactions: PointTransaction[];
};
