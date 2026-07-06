import type { MerchantStoreOrderQueueConfig } from "../../queries/merchantStoreOrderQueue/types";

export type UpdateMerchantStoreOrderQueueInput = {
  merchantStoreId: string;
  orderArchiveDelayMs?: number;
  maxActiveOrders?: number;
  webSessionTtlMs?: number;
  orderReadyPushTitle?: string | null;
  orderReadyPushBody?: string | null;
  orderNumberRolloverAfter?: number;
  autoPickUpAfterReady?: boolean;
  orderReadyReminderEnabled?: boolean;
  orderReadyReminderDelayMs?: number;
};

export type UpdateMerchantStoreOrderQueueSettingsResponse = {
  updateMerchantStoreOrderQueueSettings: MerchantStoreOrderQueueConfig;
};

export type UpdateMerchantStoreOrderQueueSettingsVariables = {
  input: UpdateMerchantStoreOrderQueueInput;
};
