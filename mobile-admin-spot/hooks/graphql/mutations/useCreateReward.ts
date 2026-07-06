import {
  CREATE_REWARD_MUTATION,
  CreateRewardResponse,
  type CreateRewardVariables,
} from "@/shared/api-client/src/graphql/mutations/reward";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useCreateReward = () => {
  return useMutationWithErrorHandling<
    CreateRewardResponse,
    CreateRewardVariables
  >(CREATE_REWARD_MUTATION, {
    operationName: "CreateReward",
    refetchQueries: ["GetMyRewards"],
    awaitRefetchQueries: true,
  });
};
