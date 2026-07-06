import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { FiltersPillTrigger } from "@/components/molecules/FiltersPillTrigger";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import React, { useMemo } from "react";
import { View } from "react-native";

export const MerchantStatsSessionScrollHeader = () => {
  const { canReadMerchant, accessLoading, setFiltersSheetOpen, loyaltyCardTemplateId, streakProgramId } =
    useMerchantStatsSession();

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (loyaltyCardTemplateId) {
      n += 1;
    }
    if (streakProgramId) {
      n += 1;
    }
    return n;
  }, [loyaltyCardTemplateId, streakProgramId]);

  return (
    <View className="gap-3">
      <View className="flex-row items-start gap-2">
        <View className="flex-1 min-w-0">
          <ContextSwitcher />
        </View>
        {!canReadMerchant || accessLoading ? null : (
          <FiltersPillTrigger
            onPress={() => setFiltersSheetOpen(true)}
            activeFilterCount={activeFilterCount}
            labelKey="MerchantStats.filterSheetTrigger"
            denseHeader
            capBadgeAt99
          />
        )}
      </View>
    </View>
  );
};
