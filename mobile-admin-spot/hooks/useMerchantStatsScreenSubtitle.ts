import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import { buildMerchantStatsStoresSubtitle } from "@/utils/merchantStatsPeriod";
import { useTranslation } from "react-i18next";

export const useMerchantStatsScreenSubtitle = (): string => {
  const { t } = useTranslation();
  const { preset, availableStoresCount, storeScope, isStoreScoped } = useMerchantStatsSession();

  const count =
    isStoreScoped || storeScope !== "network" ? 1 : availableStoresCount;

  return buildMerchantStatsStoresSubtitle(t, preset, count);
};
