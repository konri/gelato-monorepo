import { BottomSheetModal } from "@/components/molecules/Modal";
import { OrderQueueScreenHeader } from "@/components/molecules/OrderQueueScreenHeader";
import { ScannedRewardPanel } from "@/components/organisms/ScannedRewardPanel";
import type { CloseInterceptor } from "@/components/organisms/ScannedRewardPanel/types";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { OrderQueueWalkInToolbarProps } from "./types";

export const OrderQueueWalkInToolbar = ({
  showPlusButton,
  publicUrl,
}: OrderQueueWalkInToolbarProps) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const beforeCloseRef = useRef<CloseInterceptor>(null);

  const openAddTicket = useCallback(() => {
    setPanelKey((previous) => previous + 1);
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    if (beforeCloseRef.current?.()) return;
    setSheetOpen(false);
  }, []);

  return (
    <>
      <OrderQueueScreenHeader
        publicUrl={publicUrl}
        showAddButton={showPlusButton}
        openAddTicket={showPlusButton ? openAddTicket : () => {}}
      />
      {sheetOpen ? (
        <BottomSheetModal
          visible={sheetOpen}
          onClose={closeSheet}
          title={t("OrderQueue.addTicketSheetTitle")}
          snapPoints={["56%"]}
          enablePanDownToClose={false}
          keyboardBehavior="extend"
          keyboardBlurBehavior="restore"
          androidKeyboardInputMode="adjustResize"
        >
          <ScannedRewardPanel
            key={panelKey}
            userId={null}
            venueSession={null}
            onClose={closeSheet}
            onBeforeCloseRef={beforeCloseRef}
          />
        </BottomSheetModal>
      ) : null}
    </>
  );
};
