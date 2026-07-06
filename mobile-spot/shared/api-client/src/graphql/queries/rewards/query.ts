import { gql } from '@apollo/client';

export const MY_REDEEMABLE_REWARDS_QUERY = gql`
  query MyRedeemableRewards {
    myRedeemableRewards {
      id
      type
      title
      description
      pointsCost
      userPoints
      pointsNeeded
      stampsCollected
      stampsRequired
      stampsNeeded
      canRedeem
      stampCoverUrl
      stampStickerIconUrl
      imageUrl
      merchant {
        id
        name
        logoUrl
      }
      store {
        id
        name
        address
        city
      }
    }
  }
`;
