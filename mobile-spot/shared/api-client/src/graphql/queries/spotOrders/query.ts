import { gql } from '@apollo/client';

// Shared order fields for the spot staff views.
const ORDER_FIELDS = `
  id
  orderNumber
  status
  fulfillmentType
  total
  subtotal
  deliveryFee
  deliveryAddress
  noteForSpot
  noteForCourier
  customerName
  preparedById
  preparedByName
  claimedAt
  createdAt
  items { id quantity displayName boxTasteNames }
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

// Terminate an order (out of stock / closing): refunds the customer, keeps
// their loyalty points, sets status TERMINATED.
export const TERMINATE_ORDER_MUTATION = gql`
  mutation TerminateOrder($id: ID!, $reason: String) {
    terminateOrder(id: $id, reason: $reason)
  }
`;

// Richer fields for the "Needs attention" view (terminated / cancelled /
// incident-held) — includes contact info + the reason it needs attention.
const ATTENTION_FIELDS = `
  ${ORDER_FIELDS}
  customerPhone
  updatedAt
  incidentType
  incidentNote
  incidentPhotoUrl
  incidentReportedAt
  cancelReason
  cancelledAt
  terminatedAt
  terminationReason
  refundedAt
`;

// Orders needing spot attention in the last 24h (terminated / cancelled /
// failed / incident-held) so staff can contact the client, refund, re-dispatch.
export const SPOT_ATTENTION_ORDERS_QUERY = gql`
  query SpotAttentionOrders($spotId: ID!) {
    spotAttentionOrders(spotId: $spotId) {
      ${ATTENTION_FIELDS}
    }
  }
`;

// Re-dispatch an incident-held delivery order back to the courier pool (after
// the spot prepares a fresh pack). Returns it to READY.
export const REDISPATCH_ORDER_MUTATION = gql`
  mutation RedispatchOrder($id: ID!) {
    redispatchOrder(id: $id)
  }
`;
