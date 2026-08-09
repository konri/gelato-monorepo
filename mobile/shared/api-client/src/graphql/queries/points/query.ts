import { gql } from '@apollo/client';

export const GET_MY_POINT_BALANCE_QUERY = gql`
  query GetMyPointBalance {
    myPointBalance {
      totalPoints
      availablePoints
      lockedPoints
    }
  }
`;

export const GET_MY_POINT_TRANSACTIONS_QUERY = gql`
  query GetMyPointTransactions($limit: Int) {
    myPointTransactions(limit: $limit) {
      id
      type
      amount
      description
      referenceId
      referenceType
      balanceBefore
      balanceAfter
      createdAt
    }
  }
`;
