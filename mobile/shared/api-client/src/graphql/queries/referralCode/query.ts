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

// Invitations sent with my code (A2: paid at the friend's first purchase at a
// brand with a referral bonus; PENDING until then).
export const GET_MY_REFERRAL_STATS_QUERY = gql`
  query GetMyReferralStats {
    myReferralStats {
      totalReferrals
      pendingReferrals
      completedReferrals
      closedReferrals
      totalPointsEarned
      earnedByBrand {
        brandId
        brandName
        points
        referrals
      }
    }
  }
`;
