import {
  CreateRewardInput,
  UPDATE_REWARD_MUTATION,
  UpdateRewardResponse,
} from "@/shared/api-client/src/graphql/mutations/reward";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type UpdateRewardVariables = {
  data: CreateRewardInput;
  id: string;
};

export const useUpdateReward = () => {
  return useMutationWithErrorHandling<
    UpdateRewardResponse,
    UpdateRewardVariables
  >(UPDATE_REWARD_MUTATION, {
    operationName: "UpdateReward",
    refetchQueries: ["GetMyRewards"],
    awaitRefetchQueries: true,
  });
};
