import { gql } from '@apollo/client';

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      fulfillmentType
      subtotal
      discount
      deliveryFee
      total
      paymentStatus
    }
  }
`;

export const CREATE_PAYMENT_INTENT_MUTATION = gql`
  mutation CreatePaymentIntent($orderId: ID!) {
    createPaymentIntent(orderId: $orderId)
  }
`;

export const CREATE_COMPLAINT_MUTATION = gql`
  mutation CreateComplaint($orderId: ID!, $subject: String!, $message: String!) {
    createComplaint(orderId: $orderId, subject: $subject, message: $message) {
      id
      status
    }
  }
`;
