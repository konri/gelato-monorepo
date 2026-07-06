import {
  MY_OPERATOR_CAPABILITIES_QUERY,
  type MyOperatorCapabilitiesResponse,
} from "@/shared/api-client/src/graphql/queries/operatorCapabilities";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import type { UseQueryOptions } from "./types";

export const useMyOperatorCapabilities = (
  options?: UseQueryOptions,
) => {
  return useQueryWithErrorHandling<MyOperatorCapabilitiesResponse>(
    MY_OPERATOR_CAPABILITIES_QUERY,
    {
      fetchPolicy: "cache-and-network",
      skip: options?.skip,
      operationName: "MyOperatorCapabilities",
    },
  );
};
