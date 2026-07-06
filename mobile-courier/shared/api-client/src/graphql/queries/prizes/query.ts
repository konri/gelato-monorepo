import { gql } from '@apollo/client';

// Available prizes (redeemable with points).
export const PRIZES_QUERY = gql`
  query Prizes {
    prizes {
      id
      title
      titleLocal
      description
      descriptionLocal
      imageUrl
      pointsCost
      quantity
      claimed
      isActive
    }
  }
`;

// Single prize detail.
export const PRIZE_DETAIL_QUERY = gql`
  query PrizeDetail($id: ID!) {
    prize(id: $id) {
      id
      title
      titleLocal
      description
      descriptionLocal
      imageUrl
      pointsCost
      quantity
      claimed
      isActive
    }
  }
`;

// The user's claimed prizes (active + redeemed history).
export const MY_PRIZES_QUERY = gql`
  query MyPrizes {
    myPrizes(includeRedeemed: true) {
      id
      qrCode
      isRedeemed
      redeemedAt
      claimedAt
      validUntil
      prize {
        id
        title
        titleLocal
        imageUrl
        pointsCost
      }
    }
  }
`;
