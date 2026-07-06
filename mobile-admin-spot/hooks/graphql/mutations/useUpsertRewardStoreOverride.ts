import {
  UPSERT_REWARD_STORE_OVERRIDE_MUTATION,
  type UpsertRewardStoreOverrideInput,
  type UpsertRewardStoreOverrideResponse,
} from "@/shared/api-client/src/graphql/mutations/reward";
import { useMutationWithErrorHandling } from "../useMutationWithErrorHandling";

type UpsertRewardStoreOverrideVariables = {
  rewardId: string;
  storeId: string;
  data: UpsertRewardStoreOverrideInput;
};

export const useUpsertRewardStoreOverride = () => {
  return useMutationWithErrorHandling<
    UpsertRewardStoreOverrideResponse,
    UpsertRewardStoreOverrideVariables
  >(UPSERT_REWARD_STORE_OVERRIDE_MUTATION, {
    operationName: "UpsertRewardStoreOverride",
    refetchQueries: ["GetMyRewards"],
    awaitRefetchQueries: true,
  });
};
