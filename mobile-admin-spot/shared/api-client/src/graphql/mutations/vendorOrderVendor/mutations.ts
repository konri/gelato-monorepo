import { gql } from "@apollo/client";
import { VENDOR_ORDER_FIELDS_FRAGMENT } from "../../fragments/vendorOrder";

export const MARK_ORDER_READY_MUTATION = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  mutation MarkOrderReady($input: MarkOrderReadyInput!) {
    markOrderReady(input: $input) {
      ...VendorOrderFields
    }
  }
`;

export const MARK_ORDER_PICKED_UP_MUTATION = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  mutation MarkOrderPickedUp($input: OrderByIdInput!) {
    markOrderPickedUp(input: $input) {
      ...VendorOrderFields
    }
  }
`;

export const CANCEL_ORDER_MUTATION = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  mutation CancelOrderVendor($input: OrderByIdInput!) {
    cancelOrder(input: $input) {
      ...VendorOrderFields
    }
  }
`;

export const MARK_ORDER_DELAYED_MUTATION = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  mutation MarkOrderDelayed($input: OrderByIdInput!) {
    markOrderDelayed(input: $input) {
      ...VendorOrderFields
    }
  }
`;

export const MARK_ORDER_RESUME_PREPARING_MUTATION = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  mutation MarkOrderResumePreparing($input: OrderByIdInput!) {
    markOrderResumePreparing(input: $input) {
      ...VendorOrderFields
    }
  }
`;

export const REVERT_ORDER_PICK_UP_MUTATION = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  mutation RevertOrderPickUp($input: OrderByIdInput!) {
    revertOrderPickUp(input: $input) {
      ...VendorOrderFields
    }
  }
`;

export const REVERT_ORDER_READY_MUTATION = gql`
  ${VENDOR_ORDER_FIELDS_FRAGMENT}
  mutation RevertOrderReady($input: OrderByIdInput!) {
    revertOrderReady(input: $input) {
      ...VendorOrderFields
    }
  }
`;
