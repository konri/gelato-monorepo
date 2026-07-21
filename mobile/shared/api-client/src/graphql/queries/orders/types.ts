export type OrderStatus =
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

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export type OrderSpot = {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string | null;
  logoUrl?: string | null;
};

export type OrderCourierLocation = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type OrderItem = {
  id: string;
  tasteId?: string | null;
  productId?: string | null;
  quantity: number;
  pricePerUnit?: number;
  total?: number;
};

export type OrderListEntry = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  total: number;
  createdAt: string;
  deliveryAddress?: string | null;
  spot?: OrderSpot | null;
  items: OrderItem[];
};

export type OrderDetail = OrderListEntry & {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  scheduledFor?: string | null;
  courierLocation?: OrderCourierLocation | null;
  // Assigned courier identity + the PIN the customer reads out to confirm delivery.
  courierName?: string | null;
  courierPhoto?: string | null;
  deliveryPin?: string | null;
};

export type MyOrdersResponse = { myOrders: OrderListEntry[] };
export type OrderDetailResponse = { order: OrderDetail | null };
