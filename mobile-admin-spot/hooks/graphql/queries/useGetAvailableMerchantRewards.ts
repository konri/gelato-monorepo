import {
  GET_AVAILABLE_MERCHANT_REWARDS_QUERY,
  GetAvailableMerchantRewardsResponse,
  GetAvailableMerchantRewardsVariables,
  type Reward,
} from "@/shared/api-client/src/graphql/queries/myRewards";
import { useMemo } from "react";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

type UseGetAvailableMerchantRewardsOptions = {
  skip?: boolean;
  merchantId?: string;
  storeId?: string;
  sourceType?: GetAvailableMerchantRewardsVariables["sourceType"];
  fetchPolicy?: "cache-and-network" | "network-only" | "no-cache";
};

export const useGetAvailableMerchantRewards = (
  options?: UseGetAvailableMerchantRewardsOptions,
) => {
  const { skip, merchantId, storeId, sourceType, fetchPolicy = "cache-and-network" } =
    options ?? {};

  const queryResult = useQueryWithErrorHandling<
    GetAvailableMerchantRewardsResponse,
    GetAvailableMerchantRewardsVariables
  >(GET_AVAILABLE_MERCHANT_REWARDS_QUERY, {
    fetchPolicy,
    skip,
    operationName: "GetAvailableMerchantRewards",
    variables: {
      merchantId,
      storeId,
      sourceType,
    },
  });

  const rewards = useMemo<Reward[]>(
    () =>
      queryResult.dataState === "complete"
        ? (queryResult.data?.availableRewards ?? [])
        : [],
    [queryResult.data?.availableRewards, queryResult.dataState],
  );

  return {
    ...queryResult,
    rewards,
  };
};
