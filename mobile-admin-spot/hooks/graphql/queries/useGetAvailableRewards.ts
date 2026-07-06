import {
  GET_AVAILABLE_REWARDS_QUERY,
  type GetAvailableRewardsResponse,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseGetAvailableRewardsOptions = {
  userId: string;
  skip?: boolean;
};

export const useGetAvailableRewards = ({ userId, skip = false }: UseGetAvailableRewardsOptions) => {
  return useQueryWithErrorHandling<GetAvailableRewardsResponse, { userId: string }>(
    GET_AVAILABLE_REWARDS_QUERY,
    {
      operationName: "GetAvailableRewards",
      fetchPolicy: "network-only",
      variables: { userId },
      skip: skip || !userId,
    }
  );
};
