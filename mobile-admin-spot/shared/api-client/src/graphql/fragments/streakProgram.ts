import { gql } from "@apollo/client";

export const STREAK_PROGRAM_FIELDS_FRAGMENT = gql`
  fragment StreakStageFields on StreakStage {
    id
    dayThreshold
    benefitType
    rewardId
    infoMessage
    pointsMultiplier
    pointsAmount
    reward {
      id
      title
    }
  }

  fragment StreakProgramFields on StreakProgram {
    id
    merchantId
    rewardId
    name
    description
    requiredConsecutiveDays
    streakingPolicy
    streakingInterval
    timezone
    graceDays
    repeatable
    isActive
    availableStoreIds
    createdAt
    updatedAt
    reward {
      id
      title
    }
    stages {
      ...StreakStageFields
    }
  }
`;
