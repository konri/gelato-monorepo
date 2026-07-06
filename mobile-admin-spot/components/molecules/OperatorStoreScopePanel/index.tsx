import { Checkbox } from "@/components/atoms/Checkbox";
import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { OperatorStoreScopePanelProps } from "./types";

export const OperatorStoreScopePanel = (props: OperatorStoreScopePanelProps) => {
  const { t } = useTranslation();

  if (props.mode === "readOnly") {
    const { storeScopeAll, storeNames } = props;
    return (
      <View className="gap-2">
        <View className="flex-row items-center gap-3">
          <Checkbox
            checked={storeScopeAll}
            onToggle={() => {}}
            disabled
            label={t("Cooperators.storeScopeAll")}
          />
        </View>
        {!storeScopeAll ? (
          <View className="gap-2">
            <Typography variant="text-14-bold" className="text-black">
              {t("Cooperators.allowedStores")}
            </Typography>
            {storeNames.length === 0 ? (
              <Typography variant="text-12-regular" className="text-cool-gray">
                {t("AccountHub.noStoresInScope")}
              </Typography>
            ) : (
              storeNames.map((name, index) => (
                <Typography
                  key={`${name}-${index}`}
                  variant="text-14-regular-spaced"
                  className="text-dark"
                >
                  {name}
                </Typography>
              ))
            )}
          </View>
        ) : null}
      </View>
    );
  }

  const {
    storeScopeAll,
    selectedStoreIds,
    availableStores,
    onToggleStoreScopeAll,
    onToggleStoreId,
  } = props;

  return (
    <View className="gap-3">
      <Checkbox
        checked={storeScopeAll}
        label={t("Cooperators.storeScopeAll")}
        onToggle={onToggleStoreScopeAll}
      />
      {!storeScopeAll ? (
        <View className="gap-2">
          <Typography variant="text-14-bold" className="text-black">
            {t("Cooperators.allowedStores")}
          </Typography>
          {availableStores.map((store) => (
            <Checkbox
              key={store.id}
              checked={selectedStoreIds.includes(store.id)}
              label={store.name}
              onToggle={() => onToggleStoreId(store.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};
