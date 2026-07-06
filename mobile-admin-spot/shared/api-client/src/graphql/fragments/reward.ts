import { gql } from "@apollo/client";

export const REWARD_FIELDS_FRAGMENT = gql`
  fragment RewardFields on Reward {
    id
    title
    description
    imageUrl
    sourceType
    valueType
    discountPercent
    discountAmount
    pointsValue
    productName
    isActive
    availableStoreIds
    merchant {
      id
      logoUrl
    }
  }
`;

export const MERCHANT_NAME_FRAGMENT = gql`
  fragment MerchantNameFragment on Merchant {
    name
  }
`;

export const TEMPLATE_BASIC_FIELDS_FRAGMENT = gql`
  fragment TemplateBasicFieldsFragment on LoyaltyStampCardTemplate {
    title
    rewardTitle
    awardType
    minimumAmount
    resetStampsOnMilestoneClaim
  }
`;

export const MILESTONE_FULL_FRAGMENT = gql`
  fragment MilestoneFullFragment on StampMilestone {
    id
    title
    description
    milestoneType
    discountPercent
    discountAmount
    pointsReward
    stampsRequired
  }
`;

export const MILESTONE_BASIC_FRAGMENT = gql`
  fragment MilestoneBasicFragment on StampMilestone {
    title
    description
    milestoneType
    discountPercent
    discountAmount
    pointsReward
  }
`;
