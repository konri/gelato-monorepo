import { Typography } from "@/components/atoms/Typography";
import { OrderQueueTicketNumber } from "@/components/atoms/OrderQueueTicketNumber";
import { OrderQueueTicketFace } from "@/components/molecules/OrderQueueTicketFace";
import { OrderQueueTicketStaffNote } from "@/components/molecules/OrderQueueTicketStaffNote";
import { OrderQueueTicketStampOverlay } from "@/components/molecules/OrderQueueTicketStampOverlay";
import {
  getOrderQueueHasOverflowActions,
  presentOrderQueueOrderOverflowAlert,
} from "@/utils/orderQueueOrderOverflowAlert";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { OrderQueueOrderCardProps } from "./types";

const OrderQueueOrderCardComponent = ({
  order,
  canMutate,
  busy,
  queueRole = "board",
  onMarkReady,
  onMarkDelayed,
  onResumePreparing,
  onMarkPickedUp,
  onCancel,
  onRevertPickUp,
  onRevertReady,
}: OrderQueueOrderCardProps) => {
  const { t } = useTranslation();
  const status = order.status;
  const isHistory = queueRole === "history";
  const isReady = status === "READY";
  const isPreparing = status === "PREPARING";
  const isDelayed = status === "DELAYED";
  const isPickedUp = status === "PICKED_UP";
  const isKnownBoardStatus = isReady || isPreparing || isDelayed;
  const canPress = canMutate && !busy;

  const hasOverflowActions = getOrderQueueHasOverflowActions(order, queueRole, {
    onMarkReady,
    onMarkDelayed,
    onResumePreparing,
    onMarkPickedUp,
    onCancel,
    onRevertPickUp,
    onRevertReady,
  });

  const openOverflowMenu = () => {
    presentOrderQueueOrderOverflowAlert({
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
    });
  };

  const onPrimaryStamp = () => {
    if (!canPress || !isKnownBoardStatus || isHistory) {
      return;
    }
    if (isReady && onMarkPickedUp) {
      onMarkPickedUp(order.id);
      return;
    }
    if ((isPreparing || isDelayed) && onMarkReady) {
      onMarkReady(order.id);
    }
  };

  const stampLabel = isReady
    ? t("OrderQueue.stampPickedUp")
    : t("OrderQueue.stampReady");

  const menuIconColor = isHistory ? "#616161" : isReady ? "#FFFFFF" : "#616161";

  return (
    <View className="w-full overflow-visible">
      <View className="relative mx-auto w-full max-w-42 min-h-25 overflow-visible">
        <OrderQueueTicketFace
          tone={isReady && !isHistory ? "accent" : "chrome"}
          className="w-full"
          overlay={
            !isHistory && isKnownBoardStatus ? (
              <OrderQueueTicketStampOverlay
                busy={busy}
                disabled={!canPress || (!isReady && !isPreparing && !isDelayed)}
                onPress={onPrimaryStamp}
                label={stampLabel}
                isReady={isReady}
              />
            ) : undefined
          }
        >
          <View className="min-h-0 w-full flex-1 flex-col self-stretch">
            <View className="min-w-0 w-full shrink-0 pr-10">
              {isReady && !isHistory ? (
                <Typography
                  variant="text-16-bold"
                  className="self-stretch font-black text-white"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.62}
                >
                  {t("OrderQueue.statusReadyToCollect")}
                </Typography>
              ) : null}
              {isPreparing && !isHistory ? (
                <Typography
                  variant="text-16-bold"
                  className="self-stretch font-black uppercase text-gray-650"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.62}
                >
                  {t("OrderQueue.statusPreparingOnTicket")}
                </Typography>
              ) : null}
              {isDelayed && !isHistory ? (
                <Typography
                  variant="text-16-bold"
                  className="self-stretch font-black uppercase text-gray-650"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.62}
                >
                  {t("OrderQueue.columnDelayed")}
                </Typography>
              ) : null}
              {isHistory && isPickedUp ? (
                <Typography
                  variant="text-14-semibold"
                  className="mt-1 self-stretch text-steel-muted uppercase"
                >
                  {t("OrderQueue.statusPickedUpShort")}
                </Typography>
              ) : null}
              {!isHistory && !isKnownBoardStatus ? (
                <Typography
                  variant="text-12-semibold"
                  className="mt-1 self-stretch text-gray-650"
                >
                  {status}
                </Typography>
              ) : null}
            </View>
            <View className="min-h-0 w-full shrink-0">
              <OrderQueueTicketStaffNote
                note={order.note}
                tone={isReady && !isHistory ? "accent" : "chrome"}
              />
            </View>
            <View className="mt-auto w-1/2 min-w-0 self-start shrink-0 pt-1">
              <OrderQueueTicketNumber
                orderNumber={order.orderNumber}
                className={
                  isReady && !isHistory ? "text-blush" : "text-steel-muted"
                }
              />
            </View>
          </View>
        </OrderQueueTicketFace>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("OrderQueue.overflowMenuA11y")}
          hitSlop={10}
          disabled={!canPress || !hasOverflowActions}
          onPress={openOverflowMenu}
          className="absolute right-0 top-2 z-30 h-8 w-8 items-center justify-center"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={menuIconColor} />
        </Pressable>
      </View>
    </View>
  );
};

export const OrderQueueOrderCard = memo(OrderQueueOrderCardComponent);
