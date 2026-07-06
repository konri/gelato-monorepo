import {
  GET_RECENT_CLOSED_ORDERS_QUERY,
  type RecentClosedOrdersQueryResponse,
  type RecentClosedOrdersQueryVariables,
} from "@/shared/api-client/src/graphql/queries/recentClosedOrders";
import { useQueryWithErrorHandling } from "../useQueryWithErrorHandling";
import type { UseQueryOptions } from "./types";

type UseRecentClosedOrdersOptions = UseQueryOptions & {
  merchantStoreId: string | undefined | null;
  limit?: number;
};

export const useRecentClosedOrders = (options: UseRecentClosedOrdersOptions) => {
  const { merchantStoreId, limit = 50, skip } = options;

  return useQueryWithErrorHandling<
    RecentClosedOrdersQueryResponse,
    RecentClosedOrdersQueryVariables
  >(GET_RECENT_CLOSED_ORDERS_QUERY, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    skip: Boolean(skip || !merchantStoreId),
    variables: {
      merchantStoreId: merchantStoreId ?? "",
      limit,
    },
    operationName: "RecentClosedOrders",
  });
};
