import { gql } from "@apollo/client";
import { VENDOR_ORDER_FIELDS_FRAGMENT } from "../../fragments/vendorOrder";

export const GET_RECENT_CLOSED_ORDERS_QUERY = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  query RecentClosedOrders($merchantStoreId: ID!, $limit: Int) {
    recentClosedOrders(merchantStoreId: $merchantStoreId, limit: $limit) {
      ...VendorOrderFields
    }
  }
`;
