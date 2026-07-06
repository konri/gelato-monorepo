import {
  GET_MY_REWARDS_QUERY,
  GetMyRewardsResponse,
  type GetMyRewardsVariables,
  type Reward,
} from "@/shared/api-client/src/graphql/queries/myRewards";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { useMemo } from "react";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import { UseQueryOptions } from "./types";

type UseGetMyRewardsOptions = UseQueryOptions & {
  storeId?: string | null;
};

export const useGetMyRewards = (options?: UseGetMyRewardsOptions) => {
  const { selectedStoreId } = useOperatorAccess();
  const effectiveStoreId =
    options?.storeId !== undefined ? options.storeId : selectedStoreId;
  const variables: GetMyRewardsVariables | undefined = effectiveStoreId
    ? { storeId: effectiveStoreId }
    : undefined;
  const queryResult = useQueryWithErrorHandling<GetMyRewardsResponse, GetMyRewardsVariables>(
    GET_MY_REWARDS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: options?.skip,
      operationName: "GetMyRewards",
      variables,
    },
  );

  const rewards = useMemo<Reward[]>(
    () =>
      queryResult.dataState === "complete"
        ? (queryResult.data?.myRewards ?? [])
        : [],
    [queryResult.data?.myRewards, queryResult.dataState],
  );

  return {
    ...queryResult,
    rewards,
  };
};
