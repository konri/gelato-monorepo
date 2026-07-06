import { gql } from "@apollo/client";

export const STAMP_MILESTONE_DETAILS_FRAGMENT = gql`
  fragment StampMilestoneDetails on StampMilestone {
    id
    stampsRequired
    rewardId
    milestoneType
    discountPercent
    discountAmount
    pointsReward
    imageUrl
    title
    description
  }
`;

export const STAMP_CARD_TEMPLATE_DETAILS_FRAGMENT = gql`
  fragment StampCardTemplateDetails on LoyaltyStampCardTemplate {
    id
    title
    description
    stampsRequired
    rewardId
    rewardType
    rewardTitle
    rewardDescription
    rewardDiscountPercent
    rewardDiscountAmount
    rewardImageUrl
    resetStampsOnMilestoneClaim
    validFrom
    validUntil
    isActive
    stampStickerIconUrl
    awardType
    minimumAmount
    milestones {
      ...StampMilestoneDetails
    }
    stampCards {
      id
      stampsCollected
    }
  }
  ${STAMP_MILESTONE_DETAILS_FRAGMENT}
`;

export const GET_MY_STAMP_CARD_TEMPLATES_QUERY = gql`
  query GetMyStampCardTemplates {
    myStampCardTemplates {
      id
      isActive
      merchantId
      validFrom
      validUntil
    }
  }
`;

export const GET_MY_STAMP_CARD_TEMPLATES_DETAILS_QUERY = gql`
  query GetMyStampCardTemplatesDetails {
    myStampCardTemplates {
      ...StampCardTemplateDetails
    }
  }
  ${STAMP_CARD_TEMPLATE_DETAILS_FRAGMENT}
`;
