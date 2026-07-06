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

export type SpotOrderItem = { id: string; quantity: number };

export type SpotOrder = {
  id: string;
  orderNumber: string;
  status: SpotOrderStatus | string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  deliveryAddress: string;
  noteForSpot?: string | null;
  noteForCourier?: string | null;
  preparedById?: string | null;
  preparedByName?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  items: SpotOrderItem[];
};

export type SpotOrdersResponse = { spotOrders: SpotOrder[] };
export type ClaimOrderResponse = { claimOrder: SpotOrder };
export type UpdateOrderStatusResponse = { updateOrderStatus: boolean };
