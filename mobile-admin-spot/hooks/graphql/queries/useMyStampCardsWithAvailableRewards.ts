import {
    MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY,
    type MyStampCardsWithAvailableRewardsResponse,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import type { UseQueryOptions } from "./types";

export const useMyStampCardsWithAvailableRewards = (options?: UseQueryOptions) => {
  return useQueryWithErrorHandling<MyStampCardsWithAvailableRewardsResponse>(
    MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: options?.skip,
      operationName: "MyStampCardsWithAvailableRewards",
    }
  );
};

