import type { OperatorAccessStore, OperatorMerchant } from "@/hooks/useOperatorAccess/types";
import type { TFunction } from "i18next";

type ContextOption = {
  label: string;
  value: string;
};

const SEPARATOR = ":";

export const buildContextOptions = (
  merchants: OperatorMerchant[],
  stores: OperatorAccessStore[],
  includeMerchantLevelOption: boolean,
  t: TFunction,
): ContextOption[] =>
  merchants.flatMap((merchant) => {
    const merchantStores = stores.filter((s) => s.merchantId === merchant.id);
    const storeOptions = merchantStores.map((store) => ({
      label:
        merchants.length > 1
          ? `${merchant.name} - ${t("OperatorContext.storeContext", { storeName: store.name })}`
          : t("OperatorContext.storeContext", { storeName: store.name }),
      value: `store${SEPARATOR}${merchant.id}${SEPARATOR}${store.id}`,
    }));

    if (!includeMerchantLevelOption) return storeOptions;

    return [
      {
        label:
          merchants.length > 1
            ? `${merchant.name} - ${t("OperatorContext.merchantContext")}`
            : t("OperatorContext.merchantContext"),
        value: `merchant${SEPARATOR}${merchant.id}`,
      },
      ...storeOptions,
    ];
  });

export const buildCurrentValue = (
  selectedMerchantId: string | null,
  selectedStoreId: string | null,
): string => {
  if (selectedStoreId && selectedMerchantId) {
    return `store${SEPARATOR}${selectedMerchantId}${SEPARATOR}${selectedStoreId}`;
  }
  return selectedMerchantId ? `merchant${SEPARATOR}${selectedMerchantId}` : "";
};

export const parseContextValue = (
  value: string,
): { merchantId: string; storeId: string | null } | null => {
  const parts = value.split(SEPARATOR);
  if (parts[0] === "merchant" && parts[1]) {
    return { merchantId: parts[1], storeId: null };
  }
  if (parts[0] === "store" && parts[1] && parts[2]) {
    return { merchantId: parts[1], storeId: parts[2] };
  }
  return null;
};
