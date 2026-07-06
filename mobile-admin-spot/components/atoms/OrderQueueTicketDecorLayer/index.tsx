import OrderQueueTicketDecorAsset from "@/assets/images/order_queue_ticket_decor.svg";
import React from "react";
import { View } from "react-native";

import type { OrderQueueTicketDecorLayerProps } from "./types";

const DECOR_WIDTH_FULL = 142;
const DECOR_HEIGHT_FULL = 134;
const DECOR_WIDTH_COMPACT = 71;
const DECOR_HEIGHT_COMPACT = 67;

export const OrderQueueTicketDecorLayer = ({
  className,
  compact,
}: OrderQueueTicketDecorLayerProps) => {
  const width = compact ? DECOR_WIDTH_COMPACT : DECOR_WIDTH_FULL;
  const height = compact ? DECOR_HEIGHT_COMPACT : DECOR_HEIGHT_FULL;

  return (
    <View pointerEvents="none" className={className} style={{ width, height }}>
      <OrderQueueTicketDecorAsset width={width} height={height} />
    </View>
  );
};
