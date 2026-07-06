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
