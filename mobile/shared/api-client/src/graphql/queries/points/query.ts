import { gql } from '@apollo/client';

// One brand's wallet. Only a fallback: screens read wallets from the
// BrandProvider (LoyaltyOverview). null = no wallet at that brand (0 points).
export const GET_MY_POINT_BALANCE_QUERY = gql`
  query GetMyPointBalance($brandId: ID!) {
    myPointBalance(brandId: $brandId) {
      brandId
      totalPoints
      availablePoints
      lockedPoints
    }
  }
`;

// Ledger rows, newest first: every brand, or one with $brandId.
export const GET_MY_POINT_TRANSACTIONS_QUERY = gql`
  query GetMyPointTransactions($limit: Int, $brandId: ID) {
    myPointTransactions(limit: $limit, brandId: $brandId) {
      id
      type
      source
      amount
      basePoints
      multiplierPercent
      description
      referenceId
      referenceType
      balanceBefore
      balanceAfter
      createdAt
      brandId
      brand {
        id
        name
        logoUrl
      }
      spot {
        id
        name
      }
    }
  }
`;
