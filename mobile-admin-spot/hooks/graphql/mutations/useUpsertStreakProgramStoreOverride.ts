import {
  UPSERT_STREAK_PROGRAM_STORE_OVERRIDE_MUTATION,
  type UpsertStreakProgramStoreOverrideResponse,
  type UpsertStreakProgramStoreOverrideVariables,
} from "@/shared/api-client/src/graphql/mutations/streak";
import {
  useMutationWithErrorHandling,
  type UseMutationWithErrorHandlingOptions,
} from "../useMutationWithErrorHandling";

export const useUpsertStreakProgramStoreOverride = (
  options?: UseMutationWithErrorHandlingOptions<
    UpsertStreakProgramStoreOverrideResponse,
    UpsertStreakProgramStoreOverrideVariables
  >,
) => {
  return useMutationWithErrorHandling<
    UpsertStreakProgramStoreOverrideResponse,
    UpsertStreakProgramStoreOverrideVariables
  >(UPSERT_STREAK_PROGRAM_STORE_OVERRIDE_MUTATION, {
    operationName: "UpsertStreakProgramStoreOverride",
    refetchQueries: ["GetMyStreakPrograms"],
    awaitRefetchQueries: true,
    ...options,
  });
};
