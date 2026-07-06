import { gql } from "@apollo/client";
import {
  MERCHANT_NAME_FRAGMENT,
  MILESTONE_FULL_FRAGMENT,
  TEMPLATE_BASIC_FIELDS_FRAGMENT,
} from "../../fragments/reward";

export const MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY = gql`
  query MyStampCardsWithAvailableRewards {
    myStampCards {
      id
      stampsCollected
      stampsRequired
      isActive
      merchant {
        ...MerchantNameFragment
      }
      template {
        ...TemplateBasicFieldsFragment
      }
      availableRewards {
        type
        milestone {
          ...MilestoneFullFragment
        }
        mainRewardTitle
        mainRewardDescription
        mainRewardType
        mainRewardDiscountPercent
        mainRewardDiscountAmount
      }
    }
  }
  ${MERCHANT_NAME_FRAGMENT}
  ${TEMPLATE_BASIC_FIELDS_FRAGMENT}
  ${MILESTONE_FULL_FRAGMENT}
`;

export const GET_USER_STAMP_CARDS_QUERY = gql`
  query GetUserStampCards($userId: String!) {
    getUserStampCards(userId: $userId) {
      id
      stampsCollected
      stampsRequired
      isActive
      createdAt
      merchant {
        ...MerchantNameFragment
      }
      template {
        ...TemplateBasicFieldsFragment
        milestones {
          ...MilestoneFullFragment
        }
      }
      availableRewards {
        type
        milestone {
          ...MilestoneFullFragment
        }
        mainRewardTitle
        mainRewardDescription
        mainRewardType
        mainRewardDiscountPercent
        mainRewardDiscountAmount
      }
      claimedMilestones {
        id
        cardId
        milestoneId
        isAvailable
        isClaimed
        isRedeemed
        isReadyToRedeem
        redeemedAt
        claimedAt
        milestone {
          ...MilestoneFullFragment
        }
      }
    }
  }
  ${MERCHANT_NAME_FRAGMENT}
  ${TEMPLATE_BASIC_FIELDS_FRAGMENT}
  ${MILESTONE_FULL_FRAGMENT}
`;

export const GET_USER_CLAIMED_REWARDS_QUERY = gql`
  query GetUserClaimedRewards($userId: String!) {
    getUserClaimedRewards(userId: $userId) {
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

export const GET_AVAILABLE_REWARDS_QUERY = gql`
  query GetAvailableRewards($userId: String!) {
    getAvailableRewards(userId: $userId) {
      id
      source
      rewardId
      cardId
      milestoneId
      streakProgramId
      streakStageId
      title
      description
      merchantId
      merchantName
      stampsCollected
      stampsRequired
      currentStreak
      dayThreshold
      canClaim
    }
  }
`;
