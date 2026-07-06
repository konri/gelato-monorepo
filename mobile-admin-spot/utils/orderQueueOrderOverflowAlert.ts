import type { VendorOrderGraphql } from "@/shared/api-client/src/graphql/queries/activeOrders";
import type { TFunction } from "i18next";
import { Alert } from "react-native";

export type OrderQueueOverflowQueueRole = "board" | "history";

export type OrderQueueOverflowHandlers = {
  onMarkReady?: (orderId: string) => void;
  onMarkDelayed?: (orderId: string) => void;
  onResumePreparing?: (orderId: string) => void;
  onMarkPickedUp?: (orderId: string) => void;
  onCancel?: (order: VendorOrderGraphql) => void;
  onRevertPickUp?: (order: VendorOrderGraphql) => void;
  onRevertReady?: (order: VendorOrderGraphql) => void;
};

type OrderQueueOverflowAlertButton = {
  text: string;
  style?: "destructive" | "cancel";
  onPress?: () => void;
};

function getBoardOverflowFlags(order: VendorOrderGraphql) {
  const status = order.status;
  const isReady = status === "READY";
  const isPreparing = status === "PREPARING";
  const isDelayed = status === "DELAYED";
  const isPickedUp = status === "PICKED_UP";
  const isKnownBoardStatus = isReady || isPreparing || isDelayed;
  return {
    status,
    isReady,
    isPreparing,
    isDelayed,
    isPickedUp,
    isKnownBoardStatus,
  };
}

export function getOrderQueueHasOverflowActions(
  order: VendorOrderGraphql,
  queueRole: OrderQueueOverflowQueueRole,
  h: OrderQueueOverflowHandlers,
): boolean {
  const { isReady, isPreparing, isDelayed, isPickedUp, isKnownBoardStatus } =
    getBoardOverflowFlags(order);
  const isHistory = queueRole === "history";

  if (isHistory) {
    return Boolean(isPickedUp && h.onRevertPickUp);
  }
  if (!isKnownBoardStatus) {
    return Boolean(h.onCancel);
  }
  return Boolean(
    (isPreparing && h.onMarkDelayed) ||
      (isDelayed && h.onResumePreparing) ||
      ((isPreparing || isDelayed) && h.onMarkReady) ||
      (isReady && h.onMarkPickedUp) ||
      (isReady && h.onRevertReady) ||
      ((isPreparing || isDelayed || isReady) && h.onCancel),
  );
}

export type PresentOrderQueueOrderOverflowAlertParams = {
  canPress: boolean;
  t: TFunction;
  order: VendorOrderGraphql;
  queueRole: OrderQueueOverflowQueueRole;
} & OrderQueueOverflowHandlers;

export function presentOrderQueueOrderOverflowAlert(
  params: PresentOrderQueueOrderOverflowAlertParams,
): void {
  const {
    canPress,
    t,
    order,
    queueRole,
    onMarkReady,
    onMarkDelayed,
    onResumePreparing,
    onMarkPickedUp,
    onCancel,
    onRevertPickUp,
    onRevertReady,
  } = params;

  if (!canPress) {
    return;
  }

  const title = t("OrderQueue.orderActionsTitle", {
    number: String(order.orderNumber),
  });
  const cancelable = { cancelable: true as const };

  const {
    isReady,
    isPreparing,
    isDelayed,
    isPickedUp,
  } = getBoardOverflowFlags(order);
  const isHistory = queueRole === "history";

  if (isHistory) {
    if (!isPickedUp || !onRevertPickUp) {
      return;
    }
    Alert.alert(
      title,
      undefined,
      [
        {
          text: t("OrderQueue.actionRevertPickUp"),
          onPress: () => {
            onRevertPickUp(order);
          },
        },
        { text: t("Common.close"), style: "cancel" },
      ],
      cancelable,
    );
    return;
  }

  const items: (OrderQueueOverflowAlertButton | null)[] = [
    isPreparing && onMarkDelayed
      ? {
          text: t("OrderQueue.actionMarkDelayed"),
          onPress: () => {
            onMarkDelayed(order.id);
          },
        }
      : null,
    isDelayed && onResumePreparing
      ? {
          text: t("OrderQueue.actionResumePreparing"),
          onPress: () => {
            onResumePreparing(order.id);
          },
        }
      : null,
    (isPreparing || isDelayed) && onMarkReady
      ? {
          text: t("OrderQueue.actionMarkReady"),
          onPress: () => {
            onMarkReady(order.id);
          },
        }
      : null,
    isReady && onMarkPickedUp
      ? {
          text: t("OrderQueue.actionMarkPickedUp"),
          onPress: () => {
            onMarkPickedUp(order.id);
          },
        }
      : null,
    isReady && onRevertReady
      ? {
          text: t("OrderQueue.actionRevertReady"),
          onPress: () => {
            onRevertReady(order);
          },
        }
      : null,
    onCancel
      ? {
          text: t("OrderQueue.actionCancel"),
          style: "destructive",
          onPress: () => {
            onCancel(order);
          },
        }
      : null,
  ];

  const buttons = items.filter(
    (b): b is OrderQueueOverflowAlertButton => b != null,
  );

  if (buttons.length === 0) {
    return;
  }

  buttons.push({ text: t("Common.close"), style: "cancel" });
  Alert.alert(title, undefined, buttons, cancelable);
}
