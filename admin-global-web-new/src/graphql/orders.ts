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
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  deliveryAddress: string;
  customerName?: string | null;
  customerPhone?: string | null;
  courierName?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  items: OrderItem[];
};

export const SPOT_ORDERS = gql`
  query SpotOrders($spotId: ID!, $status: OrderStatus) {
    spotOrders(spotId: $spotId, status: $status) {
      id
      orderNumber
      status
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
