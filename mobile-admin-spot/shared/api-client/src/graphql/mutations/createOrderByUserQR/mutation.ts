import { gql } from "@apollo/client";

export const CREATE_ORDER_BY_USER_QR_MUTATION = gql`
  mutation CreateOrderByUserQR($input: CreateOrderByUserQRInput!) {
    createOrderByUserQR(input: $input) {
      orderId
      orderNumber
      note
    }
  }
`;
