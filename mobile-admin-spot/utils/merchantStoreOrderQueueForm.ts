import type { MerchantStoreOrderQueueConfig } from "@/shared/api-client/src/graphql/queries/merchantStoreOrderQueue";
import type { UpdateMerchantStoreOrderQueueInput } from "@/shared/api-client/src/graphql/mutations/merchantStoreOrderQueue";

export const ORDER_QUEUE_MS_PER_MINUTE = 60_000;

export type OrderQueueFormValues = {
  orderArchiveDelayMinutes: string;
  autoPickUpAfterReady: boolean;
  maxActiveOrders: string;
  orderReadyPushCustom: boolean;
  orderReadyPushTitle: string;
  orderReadyPushBody: string;
  orderReadyReminderEnabled: boolean;
  orderReadyReminderDelayMinutes: string;
  orderNumberRolloverAfter: string;
};

export function isMerchantStoreOrderQueueConfig(
  value: unknown,
): value is MerchantStoreOrderQueueConfig {
  if (!value || typeof value !== "object") {
    return false;
  }
  return (
    "orderArchiveDelayMs" in value &&
    typeof value.orderArchiveDelayMs === "number" &&
    "autoPickUpAfterReady" in value &&
    typeof value.autoPickUpAfterReady === "boolean" &&
    "maxActiveOrders" in value &&
    typeof value.maxActiveOrders === "number" &&
    "webSessionTtlMs" in value &&
    typeof value.webSessionTtlMs === "number" &&
    "orderNumberRolloverAfter" in value &&
    typeof value.orderNumberRolloverAfter === "number" &&
    "orderReadyReminderEnabled" in value &&
    typeof value.orderReadyReminderEnabled === "boolean" &&
    "orderReadyReminderDelayMs" in value &&
    typeof value.orderReadyReminderDelayMs === "number" &&
    "orderReadyPushTitle" in value &&
    (value.orderReadyPushTitle === null || typeof value.orderReadyPushTitle === "string") &&
    "orderReadyPushBody" in value &&
    (value.orderReadyPushBody === null || typeof value.orderReadyPushBody === "string")
  );
}

export function configToOrderQueueFormValues(
  config: MerchantStoreOrderQueueConfig,
): OrderQueueFormValues {
  const hasTitle = (config.orderReadyPushTitle ?? "").trim().length > 0;
  const hasBody = (config.orderReadyPushBody ?? "").trim().length > 0;
  return {
    orderArchiveDelayMinutes: String(Math.round(config.orderArchiveDelayMs / ORDER_QUEUE_MS_PER_MINUTE)),
    autoPickUpAfterReady: config.autoPickUpAfterReady,
    maxActiveOrders: String(config.maxActiveOrders),
    orderReadyPushCustom: hasTitle || hasBody,
    orderReadyPushTitle: config.orderReadyPushTitle ?? "",
    orderReadyPushBody: config.orderReadyPushBody ?? "",
    orderReadyReminderEnabled: config.orderReadyReminderEnabled,
    orderReadyReminderDelayMinutes: String(
      Math.max(1, Math.round(config.orderReadyReminderDelayMs / ORDER_QUEUE_MS_PER_MINUTE)),
    ),
    orderNumberRolloverAfter: String(config.orderNumberRolloverAfter),
  };
}

export function buildOrderQueueUpdateInput(params: {
  merchantStoreId: string;
  form: OrderQueueFormValues;
}): UpdateMerchantStoreOrderQueueInput {
  const { form } = params;

  const archiveMinutes = Number(form.orderArchiveDelayMinutes);
  const orderArchiveDelayMs =
    !Number.isNaN(archiveMinutes) && archiveMinutes >= 0
      ? archiveMinutes * ORDER_QUEUE_MS_PER_MINUTE
      : 0;

  const maxActiveOrders = Math.floor(Number(form.maxActiveOrders));
  const orderNumberRolloverAfter = Math.floor(
    Number(form.orderNumberRolloverAfter),
  );

  const reminderRaw = Number(form.orderReadyReminderDelayMinutes);
  const reminderMinutes =
    Number.isFinite(reminderRaw) && reminderRaw >= 1
      ? Math.floor(reminderRaw)
      : 15;
  const orderReadyReminderDelayMs =
    reminderMinutes * ORDER_QUEUE_MS_PER_MINUTE;

  const useCustomPush = form.orderReadyPushCustom;
  const titleTrimmed = form.orderReadyPushTitle.trim();
  const bodyTrimmed = form.orderReadyPushBody.trim();

  return {
    merchantStoreId: params.merchantStoreId,
    orderArchiveDelayMs,
    autoPickUpAfterReady: form.autoPickUpAfterReady,
    maxActiveOrders,
    orderNumberRolloverAfter,
    orderReadyPushTitle: useCustomPush ? (titleTrimmed.length > 0 ? titleTrimmed : null) : null,
    orderReadyPushBody: useCustomPush ? (bodyTrimmed.length > 0 ? bodyTrimmed : null) : null,
    orderReadyReminderEnabled: form.orderReadyReminderEnabled,
    orderReadyReminderDelayMs,
  };
}
