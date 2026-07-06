import { MerchantStatsPointsRewardsView } from "@/components/organisms/MerchantStatsPointsRewardsView";
import { MerchantStatsScrollShell } from "@/components/organisms/MerchantStatsScrollShell";
import { useMerchantStatsScreenSubtitle } from "@/hooks/useMerchantStatsScreenSubtitle";
import React from "react";

export default function StatsPointsRewardsScreen() {
  const subtitle = useMerchantStatsScreenSubtitle();

  return (
    <MerchantStatsScrollShell
      bundleContent={(bundle) => (
        <MerchantStatsPointsRewardsView bundle={bundle} screenSubtitle={subtitle} />
      )}
    />
  );
}
