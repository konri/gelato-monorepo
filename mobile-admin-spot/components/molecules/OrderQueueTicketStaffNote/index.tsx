import { Typography } from "@/components/atoms/Typography";
import { BottomSheetModal } from "@/components/molecules/Modal";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import type { OrderQueueTicketStaffNoteProps } from "./types";

const NOTE_PREVIEW_MAX_LINES = 2;
const SHEET_IF_LONGER_THAN_CHARS = 56;

const OrderQueueTicketStaffNoteComponent = ({
  note,
  tone,
}: OrderQueueTicketStaffNoteProps) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const onAccent = tone === "accent";

  if (!note) {
    return (
      <View className="mt-1 w-full min-w-0 self-stretch rounded-lg border-t border-transparent pt-1.5 pb-0.5">
        <View className="min-h-9" />
      </View>
    );
  }

  const textClass = onAccent ? "text-white/92" : "text-gray-650";
  const borderClass = onAccent ? "border-white/18" : "border-chrome-soft-edge";
  const explicitLineSegments = note.split("\n");
  const tooManyExplicitLines =
    explicitLineSegments.length > NOTE_PREVIEW_MAX_LINES;
  const needsSheet =
    note.length > SHEET_IF_LONGER_THAN_CHARS || tooManyExplicitLines;

  const shellClass = twMerge(
    "mt-1 w-full min-w-0 self-stretch rounded-lg border-t pt-1.5 pb-0.5",
    borderClass,
  );

  const noteBody = (
    <View className="relative min-h-9 w-full">
      <Typography
        variant="text-12-regular"
        className={twMerge("min-w-0 w-full leading-snug", textClass)}
        numberOfLines={NOTE_PREVIEW_MAX_LINES}
        ellipsizeMode="tail"
      >
        {note}
      </Typography>
      {needsSheet ? (
        <View className="pointer-events-none absolute -bottom-0.5 right-0 opacity-40">
          <Ionicons
            name="open-outline"
            size={11}
            color={onAccent ? "rgba(255,255,255,0.9)" : "#616161"}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      {needsSheet ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("OrderQueue.orderNoteOpenFullA11y")}
          onPress={openSheet}
          className={twMerge(shellClass, "active:opacity-85")}
        >
          {noteBody}
        </Pressable>
      ) : (
        <View className={shellClass}>{noteBody}</View>
      )}

      {needsSheet ? (
        <BottomSheetModal
          visible={sheetOpen}
          onClose={closeSheet}
          title={t("OrderQueue.assignScanNoteLabel")}
          snapPoints={["55%", "90%"]}
          enableDynamicSizing={false}
        >
          <ScrollView
            className="px-4 pb-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <Typography variant="text-16-regular-spaced" className="text-gray-900">
              {note}
            </Typography>
          </ScrollView>
        </BottomSheetModal>
      ) : null}
    </>
  );
};

export const OrderQueueTicketStaffNote = memo(OrderQueueTicketStaffNoteComponent);
