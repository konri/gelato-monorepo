import { MerchantStatsClientsView } from "@/components/organisms/MerchantStatsClientsView";
import { MerchantStatsScrollShell } from "@/components/organisms/MerchantStatsScrollShell";
import { useMerchantStatsScreenSubtitle } from "@/hooks/useMerchantStatsScreenSubtitle";
import React from "react";

export default function StatsClientsScreen() {
  const subtitle = useMerchantStatsScreenSubtitle();

  return (
    <MerchantStatsScrollShell
      bundleContent={(bundle) => <MerchantStatsClientsView bundle={bundle} screenSubtitle={subtitle} />}
    />
  );
}
