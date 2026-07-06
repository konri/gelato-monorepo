import {
  CREATE_STREAK_PROGRAM_MUTATION,
  type CreateStreakProgramResponse,
  type CreateStreakProgramVariables,
} from "@/shared/api-client/src/graphql/mutations/streak";
import {
  useMutationWithErrorHandling,
  type UseMutationWithErrorHandlingOptions,
} from "../useMutationWithErrorHandling";

export const useCreateStreakProgram = (
  options?: UseMutationWithErrorHandlingOptions<
    CreateStreakProgramResponse,
    CreateStreakProgramVariables
  >,
) => {
  return useMutationWithErrorHandling<
    CreateStreakProgramResponse,
    CreateStreakProgramVariables
  >(CREATE_STREAK_PROGRAM_MUTATION, {
    operationName: "CreateStreakProgram",
    refetchQueries: ["GetMyStreakPrograms"],
    awaitRefetchQueries: true,
    ...options,
  });
};

