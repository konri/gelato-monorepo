import { gql } from '@apollo/client';

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
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
