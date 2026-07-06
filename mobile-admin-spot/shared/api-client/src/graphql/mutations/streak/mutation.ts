import { gql } from "@apollo/client";
import { STREAK_PROGRAM_FIELDS_FRAGMENT } from "../../fragments/streakProgram";

export const CREATE_STREAK_PROGRAM_MUTATION = gql`
  ${STREAK_PROGRAM_FIELDS_FRAGMENT}
  mutation CreateStreakProgram($data: CreateStreakProgramInput!, $storeId: String) {
    createStreakProgram(data: $data, storeId: $storeId) {
      ...StreakProgramFields
    }
  }
`;

export const UPDATE_STREAK_PROGRAM_MUTATION = gql`
  ${STREAK_PROGRAM_FIELDS_FRAGMENT}
  mutation UpdateStreakProgram($streakProgramId: String!, $data: UpdateStreakProgramInput!) {
    updateStreakProgram(streakProgramId: $streakProgramId, data: $data) {
      ...StreakProgramFields
    }
  }
`;

export const UPSERT_STREAK_PROGRAM_STORE_OVERRIDE_MUTATION = gql`
  ${STREAK_PROGRAM_FIELDS_FRAGMENT}
  mutation UpsertStreakProgramStoreOverride(
    $streakProgramId: String!
    $storeId: String!
    $data: UpsertStreakProgramStoreOverrideInput!
  ) {
    upsertStreakProgramStoreOverride(streakProgramId: $streakProgramId, storeId: $storeId, data: $data) {
      ...StreakProgramFields
    }
  }
`;

export const DELETE_STREAK_PROGRAM_MUTATION = gql`
  mutation DeleteStreakProgram($streakProgramId: String!) {
    deleteStreakProgram(streakProgramId: $streakProgramId)
  }
`;

export const REGISTER_STREAK_VISIT_MUTATION = gql`
  mutation RegisterStreakVisit($data: RegisterStreakVisitInput!) {
    registerStreakVisit(data: $data) {
      currentStreak
      longestStreak
      claimableRewardsCount
      claimedCycles
      requiredConsecutiveDays
      remainingDaysToReward
      lastVisitLocalDate
      streakProgram {
        id
        name
      }
    }
  }
`;

export const CLAIM_STREAK_REWARD_MUTATION = gql`
  mutation ClaimStreakReward($streakProgramId: String!, $userId: String) {
    claimStreakReward(streakProgramId: $streakProgramId, userId: $userId) {
      id
      userId
      merchantId
      streakProgramId
      rewardId
      streakStageId
      cycleNumber
      claimedAt
      createdAt
    }
  }
`;

