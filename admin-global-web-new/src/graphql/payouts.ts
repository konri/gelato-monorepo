import { gql } from '@apollo/client';

export type SpotPayoutSummary = {
  spotId: string;
  spotName: string;
  brandId?: string | null;
  brandName?: string | null;
  amountOwed: number;
  orderCount: number;
  oldestUnpaidOrderAt?: string | null;
};

export type SpotPayout = {
  id: string;
  spotId: string;
  amount: number;
  orderCount: number;
  note?: string | null;
  paidAt: string;
  paidById?: string | null;
};

/** Amounts owed per spot (PLATFORM), optionally for one brand. */
export const SPOT_PAYOUT_SUMMARIES = gql`
  query SpotPayoutSummaries($brandId: ID) {
    spotPayoutSummaries(brandId: $brandId) {
      spotId
      spotName
      brandId
      brandName
      amountOwed
      orderCount
      oldestUnpaidOrderAt
    }
  }
`;

export const SPOT_PAYOUT_HISTORY = gql`
  query SpotPayoutHistory($spotId: ID!) {
    spotPayoutHistory(spotId: $spotId) {
      id
      spotId
      amount
      orderCount
      note
      paidAt
      paidById
    }
  }
`;

export const CREATE_SPOT_PAYOUT = gql`
  mutation CreateSpotPayout($spotId: ID!, $note: String) {
    createSpotPayout(spotId: $spotId, note: $note) {
      id
      spotId
      amount
      orderCount
      note
      paidAt
      paidById
    }
  }
`;
