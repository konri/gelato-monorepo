import { DELETE_REWARD_MUTATION } from "@/shared/api-client/src/graphql/mutations/reward";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type DeleteRewardResponse = {
  deleteReward: boolean;
};

type DeleteRewardVariables = {
  id: string;
};

export const useDeleteReward = () => {
  return useMutationWithErrorHandling<
    DeleteRewardResponse,
    DeleteRewardVariables
  >(DELETE_REWARD_MUTATION, {
    operationName: "DeleteReward",
    refetchQueries: ["GetMyRewards"],
    awaitRefetchQueries: true,
  });
};
