import { Checkbox } from "@/components/atoms/Checkbox";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { LoyaltyListFilterStoreSectionProps } from "./types";

export const LoyaltyListFilterStoreSection = ({
  availableStores,
  hideSection,
  selectedIds,
  onToggle,
}: LoyaltyListFilterStoreSectionProps) => {
  const { t } = useTranslation();
  const showStores = !hideSection && availableStores.length > 0;

  if (!showStores) {
    return null;
  }

  return (
    <View className="gap-2.5">
      <Typography variant="text-14-bold" className="text-black">
        {t("LoyaltyListFilter.storesSection")}
      </Typography>
      <Typography variant="text-12-regular" className="text-gray-600">
        {t("LoyaltyListFilter.storesHint")}
      </Typography>
      <View className="gap-2">
        {availableStores.map((store) => (
          <Checkbox
            key={store.id}
            checked={selectedIds.includes(store.id)}
            label={store.name}
            onToggle={() => onToggle(store.id)}
            accessibilityLabel={store.name}
          />
        ))}
      </View>
    </View>
  );
};
