import { gql } from '@apollo/client';

// Shared order fields for the spot staff views.
const ORDER_FIELDS = `
  id
  orderNumber
  status
  total
  subtotal
  deliveryFee
  deliveryAddress
  noteForSpot
  noteForCourier
  preparedById
  preparedByName
  claimedAt
  createdAt
  items { id quantity }
`;

// Orders for a spot, optionally filtered by status (staff view).
export const SPOT_ORDERS_QUERY = gql`
  query SpotOrders($spotId: ID!, $status: OrderStatus) {
    spotOrders(spotId: $spotId, status: $status) {
      ${ORDER_FIELDS}
    }
  }
`;

// Claim an incoming order to prepare it (first-to-claim).
export const CLAIM_ORDER_MUTATION = gql`
  mutation ClaimOrder($orderId: ID!) {
    claimOrder(orderId: $orderId) {
      ${ORDER_FIELDS}
    }
  }
`;

// Advance an order's status (PREPARING → READY, etc.).
export const UPDATE_ORDER_STATUS_MUTATION = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status)
  }
`;
