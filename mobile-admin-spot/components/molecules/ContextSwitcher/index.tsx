import { Image } from "@/components/atoms/Image";
import { Select } from "@/components/atoms/Select";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { ContextSwitcherProps } from "./types";
import { buildContextOptions, buildCurrentValue, parseContextValue } from "./utils";

export const ContextSwitcher = ({ title, storeOnly = false }: ContextSwitcherProps) => {
  const { t } = useTranslation();
  const {
    merchants,
    stores,
    selectedMerchantId,
    selectedStoreId,
    selectedScanStoreId,
    isStoreScoped,
    isAdmin,
    setMerchantContext,
    setStoreContext,
  } = useOperatorAccess();

  const scanStoreRecord = selectedScanStoreId
    ? stores.find((s) => s.id === selectedScanStoreId)
    : undefined;

  const merchantIdForLogo = storeOnly
    ? (scanStoreRecord?.merchantId ?? selectedMerchantId)
    : selectedMerchantId;
  const merchantForLogo =
    merchants.find((m) => m.id === merchantIdForLogo) ?? merchants[0];
  const storeForLogo = storeOnly
    ? scanStoreRecord
    : (stores.find((s) => s.id === selectedStoreId) ??
        stores.find((s) => s.merchantId === selectedMerchantId) ??
        stores[0]);
  const contextLogoUri = merchantForLogo?.logoUrl ?? storeForLogo?.photoUrl;

  const includeMerchantLevelOption = !storeOnly && (!isStoreScoped || isAdmin);

  const contextOptions = useMemo(
    () => buildContextOptions(merchants, stores, includeMerchantLevelOption, t),
    [merchants, stores, includeMerchantLevelOption, t],
  );

  const currentValue = useMemo(
    () =>
      storeOnly
        ? buildCurrentValue(
            scanStoreRecord?.merchantId ?? selectedMerchantId,
            selectedScanStoreId,
          )
        : buildCurrentValue(selectedMerchantId, selectedStoreId),
    [
      storeOnly,
      scanStoreRecord?.merchantId,
      selectedMerchantId,
      selectedScanStoreId,
      selectedStoreId,
    ],
  );

  const handleChange = useCallback(
    async (value: string) => {
      const parsed = parseContextValue(value);
      if (!parsed) return;

      if (storeOnly) {
        if (parsed.storeId) {
          await setStoreContext(parsed.storeId);
        }
        return;
      }
      if (parsed.merchantId !== selectedMerchantId) {
        await setMerchantContext(parsed.merchantId);
      }
      await setStoreContext(parsed.storeId);
    },
    [
      storeOnly,
      selectedMerchantId,
      setMerchantContext,
      setStoreContext,
    ],
  );

  if (contextOptions.length <= 1) return null;

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 rounded-full bg-gray-300 overflow-hidden shadow-md">
        <Image
          uri={contextLogoUri}
          contentFit="cover"
          fallbackLogoSize={18}
          className="h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View className="flex-1">
        <Select
          label={title ?? (storeOnly ? t("Company.scanningAs") : t("OperatorContext.workingInContext"))}
          variant="compact"
          placeholder={
            storeOnly ? t("OperatorContext.selectStore") : t("OperatorContext.merchantContext")
          }
          value={currentValue}
          options={contextOptions}
          onChange={handleChange}
        />
      </View>
    </View>
  );
};
