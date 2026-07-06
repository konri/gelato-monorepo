import { gql } from "@apollo/client";

export const VENDOR_ORDER_FIELDS_FRAGMENT = gql`
  fragment VendorOrderFields on Order {
    id
    orderNumber
    status
    merchantStoreId
    orderDate
    createdAt
    updatedAt
    pickedUpSource
    pickedUpAt
    userId
    sessionToken
    note
  }
`;
