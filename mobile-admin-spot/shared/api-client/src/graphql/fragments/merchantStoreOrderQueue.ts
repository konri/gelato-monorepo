import { gql } from "@apollo/client";

export const MERCHANT_STORE_ORDER_QUEUE_CONFIG_FIELDS_FRAGMENT = gql`
  fragment MerchantStoreOrderQueueConfigFields on MerchantStoreOrderQueueConfig {
    orderArchiveDelayMs
    autoPickUpAfterReady
    maxActiveOrders
    webSessionTtlMs
    orderReadyPushTitle
    orderReadyPushBody
    orderNumberRolloverAfter
    orderReadyReminderEnabled
    orderReadyReminderDelayMs
  }
`;
