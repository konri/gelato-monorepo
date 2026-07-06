import { gql } from "@apollo/client";
import { STREAK_PROGRAM_FIELDS_FRAGMENT } from "../../fragments/streakProgram";

export const GET_MY_STREAK_PROGRAMS_QUERY = gql`
  ${STREAK_PROGRAM_FIELDS_FRAGMENT}
  query GetMyStreakPrograms($storeId: String) {
    myMerchantStreaks(storeId: $storeId) {
      ...StreakProgramFields
    }
  }
`;

export const GET_MY_STREAK_STATUS_QUERY = gql`
  ${STREAK_PROGRAM_FIELDS_FRAGMENT}
  query GetMyStreakStatus($streakProgramId: String!) {
    myStreakStatus(streakProgramId: $streakProgramId) {
      currentStreak
      longestStreak
      claimableRewardsCount
      claimedCycles
      requiredConsecutiveDays
      remainingDaysToReward
      lastVisitLocalDate
      streakProgram {
        ...StreakProgramFields
      }
    }
  }
`;

