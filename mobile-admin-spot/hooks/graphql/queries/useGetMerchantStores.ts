import {
    GET_MERCHANT_STORES_QUERY,
    GetMerchantStoresResponse,
} from "@/shared/api-client/src/graphql/queries/merchantStores";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

import { UseQueryOptions } from "./types";

export const useGetMerchantStores = (options?: UseQueryOptions) => {
  return useQueryWithErrorHandling<GetMerchantStoresResponse>(GET_MERCHANT_STORES_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip,
    operationName: "GetMerchantStores",
  });
};
