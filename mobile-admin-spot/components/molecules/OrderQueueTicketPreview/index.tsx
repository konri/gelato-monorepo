import { Typography } from "@/components/atoms/Typography";
import { OrderQueueTicketNumber } from "@/components/atoms/OrderQueueTicketNumber";
import { OrderQueueTicketFace } from "@/components/molecules/OrderQueueTicketFace";
import React from "react";
import { View } from "react-native";

import type { OrderQueueTicketPreviewProps } from "./types";

export const OrderQueueTicketPreview = ({
  orderNumber,
  statusLabel,
  pickupPlaceLabel,
  pickupPlaceName,
}: OrderQueueTicketPreviewProps) => {
  return (
    <OrderQueueTicketFace tone="accent" className="max-w-sm">
      <View className="min-h-0 w-full flex-1 flex-col self-stretch justify-between">
        <View className="min-w-0 w-full shrink-0">
          <Typography variant="text-29-black-33" className="self-stretch text-blush">
            {statusLabel}
          </Typography>

          <View className="mt-3 gap-2.5 self-stretch">
            <Typography
              variant="text-17-semibold-24"
              className="self-stretch text-blush"
            >
              {pickupPlaceLabel}
            </Typography>
            <Typography variant="text-31-black-37" className="self-stretch text-white">
              {pickupPlaceName}
            </Typography>
          </View>
        </View>
        <View className="mt-4 w-1/2 min-w-0 self-start shrink-0">
          <OrderQueueTicketNumber
            orderNumber={orderNumber}
            className="text-blush"
          />
        </View>
      </View>
    </OrderQueueTicketFace>
  );
};
