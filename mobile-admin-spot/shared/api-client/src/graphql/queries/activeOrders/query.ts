import { gql } from "@apollo/client";
import { VENDOR_ORDER_FIELDS_FRAGMENT } from "../../fragments/vendorOrder";

export const GET_ACTIVE_ORDERS_QUERY = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  query ActiveOrders($merchantStoreId: ID!) {
    activeOrders(merchantStoreId: $merchantStoreId) {
      ...VendorOrderFields
    }
  }
`;
