import { MerchantStatsStreaksView } from "@/components/organisms/MerchantStatsStreaksView";
import { MerchantStatsScrollShell } from "@/components/organisms/MerchantStatsScrollShell";
import { useMerchantStatsScreenSubtitle } from "@/hooks/useMerchantStatsScreenSubtitle";
import React from "react";

export default function StatsStreaksScreen() {
  const subtitle = useMerchantStatsScreenSubtitle();

  return (
    <MerchantStatsScrollShell
      bundleContent={(bundle) => <MerchantStatsStreaksView bundle={bundle} screenSubtitle={subtitle} />}
    />
  );
}
