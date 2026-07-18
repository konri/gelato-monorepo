export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

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
  total: number;
  createdAt: string;
  deliveryAddress: string;
  spot?: OrderSpot | null;
  items: OrderItem[];
};

export type OrderDetail = OrderListEntry & {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  paymentStatus: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  scheduledFor?: string | null;
  courierLocation?: OrderCourierLocation | null;
  // Assigned courier + the pickup code staff read out to the courier.
  courierName?: string | null;
  courierPhoto?: string | null;
  pickupCode?: string | null;
};

export type MyOrdersResponse = { myOrders: OrderListEntry[] };
export type OrderDetailResponse = { order: OrderDetail | null };
