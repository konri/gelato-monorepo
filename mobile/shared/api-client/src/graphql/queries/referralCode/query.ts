import { gql } from '@apollo/client';

export const GET_MY_REFERRAL_CODE_QUERY = gql`
  query GetMyReferralCode {
    myReferralCode {
      id
      code
      createdAt
    }
  }
`;
