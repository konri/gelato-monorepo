import { gql } from "@apollo/client";

export const CREATE_ORDER_BY_SESSION_MUTATION = gql`
  mutation CreateOrderBySession($input: CreateOrderBySessionInput!) {
    createOrderBySession(input: $input) {
      orderId
      orderNumber
      note
    }
  }
`;
