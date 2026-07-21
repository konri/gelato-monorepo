export type SpotOrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'TERMINATED';

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
  customerPhone?: string | null;
  preparedById?: string | null;
  preparedByName?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  // Delivery incident (courier-reported) + spot termination — attention view.
  incidentType?: string | null;
  incidentNote?: string | null;
  incidentPhotoUrl?: string | null;
  incidentReportedAt?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  refundedAt?: string | null;
  items: SpotOrderItem[];
};

export type SpotOrdersResponse = { spotOrders: SpotOrder[] };
export type SpotAttentionOrdersResponse = { spotAttentionOrders: SpotOrder[] };
export type ClaimOrderResponse = { claimOrder: SpotOrder };
export type UpdateOrderStatusResponse = { updateOrderStatus: boolean };
export type RedispatchOrderResponse = { redispatchOrder: boolean };
