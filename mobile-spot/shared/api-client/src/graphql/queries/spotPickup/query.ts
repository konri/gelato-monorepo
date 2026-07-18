import { gql } from '@apollo/client';

// Open pickup orders for a customer at a spot (resolved from a scanned QR/code).
export const COLLECTABLE_PICKUP_ORDERS_QUERY = gql`
  query CollectablePickupOrders($spotId: ID!, $userId: ID!) {
    collectablePickupOrders(spotId: $spotId, userId: $userId) {
      id
      orderNumber
      status
      paymentStatus
      paymentMethod
      subtotal
      total
      createdAt
      items {
        id
        quantity
      }
    }
  }
`;

// Mark a pickup order collected; awards points for cash orders.
export const COLLECT_PICKUP_ORDER_MUTATION = gql`
  mutation CollectPickupOrder($orderId: ID!) {
    collectPickupOrder(orderId: $orderId) {
      orderId
      orderNumber
      status
      pointsAwarded
    }
  }
`;
