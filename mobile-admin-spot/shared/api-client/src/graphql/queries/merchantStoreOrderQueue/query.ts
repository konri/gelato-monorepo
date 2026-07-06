import { gql } from "@apollo/client";
import { MERCHANT_STORE_ORDER_QUEUE_CONFIG_FIELDS_FRAGMENT } from "../../fragments/merchantStoreOrderQueue";

export const GET_MERCHANT_STORE_ORDER_QUEUE_CONFIG_QUERY = gql`
  ${MERCHANT_STORE_ORDER_QUEUE_CONFIG_FIELDS_FRAGMENT}
  query GetMerchantStoreOrderQueueConfig($merchantStoreId: ID!) {
    merchantStoreOrderQueueConfig(merchantStoreId: $merchantStoreId) {
      ...MerchantStoreOrderQueueConfigFields
    }
  }
`;
