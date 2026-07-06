import { gql } from "@apollo/client";
import { MERCHANT_STORE_ORDER_QUEUE_CONFIG_FIELDS_FRAGMENT } from "../../fragments/merchantStoreOrderQueue";

export const UPDATE_MERCHANT_STORE_ORDER_QUEUE_SETTINGS_MUTATION = gql`
  ${MERCHANT_STORE_ORDER_QUEUE_CONFIG_FIELDS_FRAGMENT}
  mutation UpdateMerchantStoreOrderQueueSettings($input: UpdateMerchantStoreOrderQueueInput!) {
    updateMerchantStoreOrderQueueSettings(input: $input) {
      ...MerchantStoreOrderQueueConfigFields
    }
  }
`;
