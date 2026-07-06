import { CircularIconButton } from "@/components/atoms/CircularIconButton";
import { Typography } from "@/components/atoms/Typography";
import { OrderQueueCustomerWebLinkTrigger } from "@/components/molecules/OrderQueueCustomerWebLinkTrigger";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { OrderQueueScreenHeaderProps } from "./types";

export const OrderQueueScreenHeader = ({
  publicUrl,
  showAddButton,
  openAddTicket,
}: OrderQueueScreenHeaderProps) => {
  const { t } = useTranslation();

  return (
    <View className="flex-row justify-between items-center">
      <Typography
        variant="text-20-bold"
        className="text-black shrink min-w-0 pr-2"
      >
        {t("OrderQueue.screenHeaderTitle")}
      </Typography>
      <View className="flex-row items-center gap-2 shrink-0">
        <OrderQueueCustomerWebLinkTrigger publicUrl={publicUrl} />
        {showAddButton ? (
          <CircularIconButton
            onPress={openAddTicket}
            size={40}
            disabled={false}
          />
        ) : null}
      </View>
    </View>
  );
};
