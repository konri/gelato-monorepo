import { gql } from "@apollo/client";
import { STAMP_MILESTONE_FRAGMENT } from "../../fragments/stampMilestone";

export const UPDATE_STAMP_CARD_TEMPLATE_MUTATION = gql`
  mutation UpdateStampCardTemplate(
    $data: CreateStampCardTemplateInput!
    $id: String!
  ) {
    updateStampCardTemplate(data: $data, id: $id) {
      id
      merchantId
      title
      stampsRequired
      awardType
      minimumAmount
      rewardType
      rewardTitle
      rewardDescription
      rewardDiscountPercent
      rewardDiscountAmount
      rewardImageUrl
      isActive
      milestones {
        ...StampMilestoneFragment
      }
    }
  }
  ${STAMP_MILESTONE_FRAGMENT}
`;

export const CREATE_STAMP_CARD_TEMPLATE_MUTATION = gql`
  mutation CreateStampCardTemplate($data: CreateStampCardTemplateInput!) {
    createStampCardTemplate(data: $data) {
      id
      merchantId
      title
      description
      stampCoverUrl
      stampStickerIconUrl
      stampsRequired
      rewardType
      rewardTitle
      rewardDescription
      rewardDiscountPercent
      rewardDiscountAmount
      rewardImageUrl
      resetStampsOnMilestoneClaim
      isActive
      validFrom
      validUntil
      awardType
      minimumAmount
      createdAt
      updatedAt
      stampCards {
        id
      }
      milestones {
        ...StampMilestoneFragment
      }
    }
  }
  ${STAMP_MILESTONE_FRAGMENT}
`;
