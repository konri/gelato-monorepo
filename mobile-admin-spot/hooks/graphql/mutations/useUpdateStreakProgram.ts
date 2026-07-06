import {
  UPDATE_STREAK_PROGRAM_MUTATION,
  type UpdateStreakProgramResponse,
  type UpdateStreakProgramVariables,
} from "@/shared/api-client/src/graphql/mutations/streak";
import {
  useMutationWithErrorHandling,
  type UseMutationWithErrorHandlingOptions,
} from "../useMutationWithErrorHandling";

export const useUpdateStreakProgram = (
  options?: UseMutationWithErrorHandlingOptions<
    UpdateStreakProgramResponse,
    UpdateStreakProgramVariables
  >,
) => {
  return useMutationWithErrorHandling<
    UpdateStreakProgramResponse,
    UpdateStreakProgramVariables
  >(UPDATE_STREAK_PROGRAM_MUTATION, {
    operationName: "UpdateStreakProgram",
    refetchQueries: ["GetMyStreakPrograms"],
    awaitRefetchQueries: true,
    ...options,
  });
};

