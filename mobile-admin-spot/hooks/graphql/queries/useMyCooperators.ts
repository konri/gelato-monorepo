import {
  MY_COOPERATORS_QUERY,
  type MyCooperatorsResponse,
} from "@/shared/api-client/src/graphql/queries/myCooperators";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import type { UseQueryOptions } from "./types";

export const useMyCooperators = (options?: UseQueryOptions) => {
  return useQueryWithErrorHandling<MyCooperatorsResponse>(MY_COOPERATORS_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: options?.skip,
    operationName: "MyCooperators",
  });
};
