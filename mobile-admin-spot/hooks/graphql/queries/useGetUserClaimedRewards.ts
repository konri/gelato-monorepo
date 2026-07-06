import {
    GET_USER_CLAIMED_REWARDS_QUERY,
    type GetUserClaimedRewardsResponse,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseGetUserClaimedRewardsOptions = {
    userId: string;
    skip?: boolean;
};

export const useGetUserClaimedRewards = ({ userId, skip = false }: UseGetUserClaimedRewardsOptions) => {
  return useQueryWithErrorHandling<GetUserClaimedRewardsResponse, { userId: string }>(
    GET_USER_CLAIMED_REWARDS_QUERY,
    {
      operationName: "GetUserClaimedRewards",
      fetchPolicy: "network-only",
      variables: { userId },
      skip: skip || !userId,
    }
  );
};

