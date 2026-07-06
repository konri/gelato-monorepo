import {
  GET_ACTIVE_ORDERS_QUERY,
  type ActiveOrdersQueryResponse,
  type ActiveOrdersQueryVariables,
} from "@/shared/api-client/src/graphql/queries/activeOrders";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import type { UseQueryOptions } from "./types";

type UseActiveOrdersOptions = UseQueryOptions & {
  merchantStoreId: string | undefined | null;
};

export const useActiveOrders = (options: UseActiveOrdersOptions) => {
  const { merchantStoreId, skip } = options;

  return useQueryWithErrorHandling<
    ActiveOrdersQueryResponse,
    ActiveOrdersQueryVariables
  >(GET_ACTIVE_ORDERS_QUERY, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    skip: Boolean(skip || !merchantStoreId),
    variables: { merchantStoreId: merchantStoreId ?? "" },
    operationName: "ActiveOrders",
  });
};
