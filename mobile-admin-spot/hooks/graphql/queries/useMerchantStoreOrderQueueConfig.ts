import {
  GET_MERCHANT_STORE_ORDER_QUEUE_CONFIG_QUERY,
  type GetMerchantStoreOrderQueueConfigResponse,
  type GetMerchantStoreOrderQueueConfigVariables,
} from "@/shared/api-client/src/graphql/queries/merchantStoreOrderQueue";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import type { UseQueryOptions } from "./types";

type UseMerchantStoreOrderQueueConfigOptions = UseQueryOptions & {
  merchantStoreId: string | undefined;
};

export const useMerchantStoreOrderQueueConfig = (
  options: UseMerchantStoreOrderQueueConfigOptions,
) => {
  const { merchantStoreId, skip } = options;

  return useQueryWithErrorHandling<
    GetMerchantStoreOrderQueueConfigResponse,
    GetMerchantStoreOrderQueueConfigVariables
  >(GET_MERCHANT_STORE_ORDER_QUEUE_CONFIG_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: Boolean(skip || !merchantStoreId),
    variables: { merchantStoreId: merchantStoreId ?? "" },
    operationName: "GetMerchantStoreOrderQueueConfig",
  });
};
