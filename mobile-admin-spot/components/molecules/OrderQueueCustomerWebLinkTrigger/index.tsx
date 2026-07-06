import { BottomSheetModal } from "@/components/molecules/Modal";
import { OrderQueueCustomerWebLinkPanel } from "@/components/molecules/OrderQueueCustomerWebLinkPanel";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import type { OrderQueueCustomerWebLinkTriggerProps } from "./types";

export function OrderQueueCustomerWebLinkTrigger({
  publicUrl,
}: OrderQueueCustomerWebLinkTriggerProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [publicUrl]);

  if (publicUrl == null || publicUrl.length === 0) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setSheetOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t("OrderQueue.publicWebSessionOpenSheetA11y")}
        className="h-10 w-10 items-center justify-center rounded-full border border-blue-900 bg-white active:opacity-90"
        hitSlop={6}
      >
        <Ionicons name="link-outline" size={22} color="#1e3a5f" />
      </Pressable>
      {sheetOpen ? (
        <BottomSheetModal
          visible={sheetOpen}
          onClose={() => {
            setSheetOpen(false);
          }}
          title={t("OrderQueue.publicWebSessionTitle")}
          snapPoints={["40%"]}
        >
          <OrderQueueCustomerWebLinkPanel publicUrl={publicUrl} />
        </BottomSheetModal>
      ) : null}
    </>
  );
}
