import type { VendorOrderGraphql } from "@/shared/api-client/src/graphql/queries/activeOrders";

export type OrderQueueOrderCardQueueRole = "board" | "history";

export type OrderQueueOrderCardProps = {
  order: VendorOrderGraphql;
  canMutate: boolean;
  busy: boolean;
  queueRole?: OrderQueueOrderCardQueueRole;
  onMarkReady?: (orderId: string) => void;
  onMarkDelayed?: (orderId: string) => void;
  onResumePreparing?: (orderId: string) => void;
  onMarkPickedUp?: (orderId: string) => void;
  onCancel?: (order: VendorOrderGraphql) => void;
  onRevertPickUp?: (order: VendorOrderGraphql) => void;
  onRevertReady?: (order: VendorOrderGraphql) => void;
};
