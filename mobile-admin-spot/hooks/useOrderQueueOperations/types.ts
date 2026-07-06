import type { VendorOrderGraphql } from "@/shared/api-client/src/graphql/queries/activeOrders";
import type { ApolloError } from "@apollo/client";

export type OrderQueueKnownColumnKey = "PREPARING" | "DELAYED" | "READY";

export type OrderQueueKanbanColumnKey =
  | OrderQueueKnownColumnKey
  | (string & {});

export type OrderQueueKanbanColumn = {
  key: OrderQueueKanbanColumnKey;
  items: VendorOrderGraphql[];
};

export type OrderQueueOperations = {
  shouldLoadQueue: boolean;
  queueStoreId: string | null;
  error: ApolloError | undefined;
  refetch: () => Promise<unknown>;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  columns: OrderQueueKanbanColumn[];
  closedOrders: VendorOrderGraphql[];
  showNoStoresLine: boolean;
  showOrdersSkeleton: boolean;
  mutationsEnabled: boolean;
  busyOrderId: string | null;
  onMarkReady: ((orderId: string) => void) | undefined;
  onMarkDelayed: ((orderId: string) => void) | undefined;
  onResumePreparing: ((orderId: string) => void) | undefined;
  onMarkPickedUp: ((orderId: string) => void) | undefined;
  onCancelPress: ((order: VendorOrderGraphql) => void) | undefined;
  onRevertPickUp: ((order: VendorOrderGraphql) => void) | undefined;
  onRevertReady: ((order: VendorOrderGraphql) => void) | undefined;
};
