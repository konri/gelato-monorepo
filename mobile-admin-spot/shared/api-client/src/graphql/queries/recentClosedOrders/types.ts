import type { VendorOrderGraphql } from "../activeOrders/types";

export type RecentClosedOrdersQueryVariables = {
  merchantStoreId: string;
  limit?: number;
};

export type RecentClosedOrdersQueryResponse = {
  recentClosedOrders: VendorOrderGraphql[];
};
