import { OrderQueueTicketDecorLayer } from "@/components/atoms/OrderQueueTicketDecorLayer";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

import type { OrderQueueTicketFaceProps } from "./types";

export const OrderQueueTicketFace = (props: OrderQueueTicketFaceProps) => {
  const { tone, children, className, overlay } = props;

  const [ticketWidth, setTicketWidth] = useState<number | undefined>(undefined);

  const onTicketLayout = useCallback((width: number) => {
    setTicketWidth(width);
  }, []);

  const compact = ticketWidth != null && ticketWidth < 232;

  const shadowShellClasses =
    tone === "accent" ? "shadow-raised" : "shadow-chrome-soft";

  const surfaceShellClasses =
    tone === "accent"
      ? "border border-accent-edge bg-accent"
      : "border border-chrome-soft-edge bg-chrome-soft";

  const outerMin = compact ? "min-h-25" : "min-h-52";

  const decorBoxClass = compact
    ? "absolute -right-1 -top-1 z-0 rotate-12"
    : "absolute -right-2 -top-2 z-0 rotate-12";

  const innerPad = compact
    ? "z-1 flex min-h-0 flex-1 flex-col items-start self-stretch pl-3.75 pr-3.5 pt-2 pb-3.5"
    : "z-1 flex min-h-0 flex-1 flex-col items-start self-stretch pt-5.75 pr-3.75 pb-3.5 pl-7";

  return (
    <View className={twMerge("w-full rounded-14", shadowShellClasses)}>
      <View
        className={twMerge(
          "relative isolate flex w-full min-h-0 flex-col overflow-hidden rounded-14",
          outerMin,
          surfaceShellClasses,
          className,
        )}
        onLayout={(event) => {
          onTicketLayout(event.nativeEvent.layout.width);
        }}
      >
        <OrderQueueTicketDecorLayer className={decorBoxClass} compact={compact} />

        <View className={innerPad}>{children}</View>

        {overlay}
      </View>
    </View>
  );
};
