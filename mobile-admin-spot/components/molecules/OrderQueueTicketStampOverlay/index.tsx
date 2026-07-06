import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";

import type { OrderQueueTicketStampOverlayProps } from "./types";

export const OrderQueueTicketStampOverlay = (
  props: OrderQueueTicketStampOverlayProps,
) => {
  const { busy, disabled, onPress, label, isReady } = props;

  const stampShellClasses = isReady
    ? "pt-2.5 border-chrome-ring-pale bg-chrome-soft"
    : "pt-4 border-coral-edge bg-accent";

  const labelToneClass = isReady ? "text-graphite-soft" : "text-white";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="absolute -right-6 -bottom-12 z-20 h-25 w-25"
    >
      <View className="h-full w-full overflow-hidden rounded-full">
        {busy ? (
          <View className="h-full w-full items-center justify-center rounded-full bg-black/20">
            <ActivityIndicator color="#FFFFFF" size="small" />
          </View>
        ) : (
          <View
            className={twMerge(
              "h-full w-full rounded-full flex-col items-center border-2 relative",
              stampShellClasses,
            )}
          >
            <View className="absolute h-1/2 w-3/4 bottom-14 left-2 items-center">
              {isReady ? (
                <Ionicons name="close" size={24} color="#5D5E60" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
              <Typography
                variant="text-14-semibold-24"
                className={twMerge("text-center uppercase", labelToneClass)}
              >
                {label}
              </Typography>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
};
