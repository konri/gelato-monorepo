import {
    CLAIM_REWARD_MUTATION,
    type ClaimRewardResponse,
    type ClaimRewardVariables,
} from "@/shared/api-client/src/graphql/mutations/rewards";
import {
    GET_AVAILABLE_REWARDS_QUERY,
    GET_USER_CLAIMED_REWARDS_QUERY,
    GET_USER_STAMP_CARDS_QUERY,
    MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

export const useClaimReward = () => {
  return useMutationWithErrorHandling<ClaimRewardResponse, ClaimRewardVariables>(
    CLAIM_REWARD_MUTATION,
    {
      operationName: "ClaimReward",
      refetchQueries: [
        { query: MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY },
        { query: GET_AVAILABLE_REWARDS_QUERY },
        { query: GET_USER_CLAIMED_REWARDS_QUERY },
        { query: GET_USER_STAMP_CARDS_QUERY },
      ],
    }
  );
};

