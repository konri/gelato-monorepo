import { MerchantStatsCompareView } from "@/components/organisms/MerchantStatsCompareView";
import { MerchantStatsScrollShell } from "@/components/organisms/MerchantStatsScrollShell";
import { useMerchantStatsScreenSubtitle } from "@/hooks/useMerchantStatsScreenSubtitle";
import React from "react";

export default function StatsCompareScreen() {
  const subtitle = useMerchantStatsScreenSubtitle();

  return (
    <MerchantStatsScrollShell
      bundleContent={(bundle) => <MerchantStatsCompareView bundle={bundle} screenSubtitle={subtitle} />}
    />
  );
}
