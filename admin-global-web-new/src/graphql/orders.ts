import { gql } from '@apollo/client';

export type OrderItem = {
  id: string;
  quantity: number;
  tasteId?: string | null;
  productId?: string | null;
  total: number;
};

export type SpotOrder = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentType: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  deliveryAddress?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  courierName?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  collectedAt?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  items: OrderItem[];
};

export const SPOT_ORDERS = gql`
  query SpotOrders($spotId: ID!, $status: OrderStatus) {
    spotOrders(spotId: $spotId, status: $status) {
      id
      orderNumber
      status
      fulfillmentType
      subtotal
      deliveryFee
      total
      paymentStatus
      deliveryAddress
      customerName
      customerPhone
      courierName
      createdAt
      deliveredAt
      collectedAt
      terminatedAt
      terminationReason
      items {
        id
        quantity
        tasteId
        productId
        total
      }
    }
  }
`;
