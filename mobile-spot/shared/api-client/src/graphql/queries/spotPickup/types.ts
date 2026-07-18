export type CollectablePickupOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  subtotal: number;
  total: number;
  createdAt: string;
  items: { id: string; quantity: number }[];
};

export type CollectablePickupOrdersResponse = {
  collectablePickupOrders: CollectablePickupOrder[];
};

export type CollectOrderResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  pointsAwarded: number;
};

export type CollectPickupOrderResponse = {
  collectPickupOrder: CollectOrderResult;
};
