import { gql } from "@apollo/client";

export const CREATE_STAMP_MILESTONE_INPUT_FRAGMENT = gql`
  fragment CreateStampMilestoneInputFragment on CreateStampMilestoneInput {
    stampsRequired
    milestoneType
    discountPercent
    discountAmount
    pointsReward
    title
    description
  }
`;

export const STAMP_MILESTONE_FRAGMENT = gql`
  fragment StampMilestoneFragment on StampMilestone {
    id
    templateId
    stampsRequired
    milestoneType
    discountPercent
    discountAmount
    pointsReward
    imageUrl
    title
    description
    isActive
    createdAt
    updatedAt
  }
`;
