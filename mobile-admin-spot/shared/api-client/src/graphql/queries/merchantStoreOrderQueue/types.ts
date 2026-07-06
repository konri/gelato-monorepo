export type MerchantStoreOrderQueueConfig = {
  orderArchiveDelayMs: number;
  autoPickUpAfterReady: boolean;
  maxActiveOrders: number;
  webSessionTtlMs: number;
  orderReadyPushTitle: string | null;
  orderReadyPushBody: string | null;
  orderNumberRolloverAfter: number;
  orderReadyReminderEnabled: boolean;
  orderReadyReminderDelayMs: number;
};

export type GetMerchantStoreOrderQueueConfigResponse = {
  merchantStoreOrderQueueConfig: MerchantStoreOrderQueueConfig;
};

export type GetMerchantStoreOrderQueueConfigVariables = {
  merchantStoreId: string;
};
