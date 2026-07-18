export type SpotOrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export type SpotOrderItem = {
  id: string;
  quantity: number;
  // Human-readable name (taste title / product name), resolved server-side.
  displayName?: string | null;
  // For box products: chosen taste names (one entry per scoop).
  boxTasteNames?: string[] | null;
};

export type SpotFulfillmentType = 'DELIVERY' | 'PICKUP';

export type SpotOrder = {
  id: string;
  orderNumber: string;
  status: SpotOrderStatus | string;
  fulfillmentType: SpotFulfillmentType;
  total: number;
  subtotal: number;
  deliveryFee: number;
  deliveryAddress?: string | null;
  noteForSpot?: string | null;
  noteForCourier?: string | null;
  customerName?: string | null;
  preparedById?: string | null;
  preparedByName?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  items: SpotOrderItem[];
};

export type SpotOrdersResponse = { spotOrders: SpotOrder[] };
export type ClaimOrderResponse = { claimOrder: SpotOrder };
export type UpdateOrderStatusResponse = { updateOrderStatus: boolean };
