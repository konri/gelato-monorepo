import { gql } from "@apollo/client";
import { MERCHANT_STORE_ORDER_QUEUE_CONFIG_FIELDS_FRAGMENT } from "./merchantStoreOrderQueue";

export const MERCHANT_STORE_BASIC_FIELDS = gql`
  ${MERCHANT_STORE_ORDER_QUEUE_CONFIG_FIELDS_FRAGMENT}
  fragment MerchantStoreBasicFields on MerchantStore {
    id
    name
    address
    city
    phone
    latitude
    longitude
    photoUrl
    isActive
    merchantId
    orderQueueSettings {
      ...MerchantStoreOrderQueueConfigFields
    }
    createdAt
    updatedAt
  }
`;

