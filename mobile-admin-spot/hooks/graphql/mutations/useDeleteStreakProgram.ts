import {
  DELETE_STREAK_PROGRAM_MUTATION,
  type DeleteStreakProgramResponse,
  type DeleteStreakProgramVariables,
} from "@/shared/api-client/src/graphql/mutations/streak";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useDeleteStreakProgram = () => {
  return useMutationWithErrorHandling<
    DeleteStreakProgramResponse,
    DeleteStreakProgramVariables
  >(DELETE_STREAK_PROGRAM_MUTATION, {
    operationName: "DeleteStreakProgram",
    refetchQueries: ["GetMyStreakPrograms"],
    awaitRefetchQueries: true,
  });
};
