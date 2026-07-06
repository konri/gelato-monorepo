import { gql } from "@apollo/client";

export const CLAIM_REWARD_MUTATION = gql`
  mutation ClaimReward($userRewardId: String!, $storeId: ID) {
    claimUserReward(userRewardId: $userRewardId, storeId: $storeId) {
      id
      source
      rewardId
      streakProgramId
      streakStageId
      cardId
      milestoneId
      title
      description
      merchantId
      merchantName
      claimedAt
      isRedeemed
      redeemedAt
    }
  }
`;

export const REDEEM_REWARD_MUTATION = gql`
  mutation RedeemReward($userRewardId: String!, $storeId: ID!) {
    redeemUserReward(userRewardId: $userRewardId, storeId: $storeId) {
      id
      source
      rewardId
      streakProgramId
      streakStageId
      cardId
      milestoneId
      title
      description
      merchantId
      merchantName
      claimedAt
      isRedeemed
      redeemedAt
    }
  }
`;

export const ADD_STAMP_BY_USER_ID_MUTATION = gql`
  mutation AddStampByUserId(
    $userId: String!
    $templateId: String
    $description: String!
    $count: Int
    $storeId: String!
  ) {
    addStampByUserId(
      userId: $userId
      templateId: $templateId
      description: $description
      count: $count
      storeId: $storeId
    ) {
      id
      cardId
      isUsed
      createdAt
    }
  }
`;

