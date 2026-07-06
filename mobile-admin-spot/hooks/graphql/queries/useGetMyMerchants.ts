import {
    GET_MY_MERCHANTS_QUERY,
    MyMerchantsResponse,
} from "@/shared/api-client/src/graphql/queries/myMerchants";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";

import { UseQueryOptions } from "./types";

export const useGetMyMerchants = (options?: UseQueryOptions) => {
  return useQueryWithErrorHandling<MyMerchantsResponse>(GET_MY_MERCHANTS_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip,
    operationName: "GetMyMerchants",
  });
};
