import { StatsScreenHeading } from "@/components/molecules/StatsScreenHeading";
import { MerchantStatsHub } from "@/components/organisms/MerchantStatsHub";
import { MerchantStatsScrollShell } from "@/components/organisms/MerchantStatsScrollShell";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import React from "react";
import { useTranslation } from "react-i18next";

export default function MerchantStatsScreen() {
  const { t } = useTranslation();
  const { storeScope, selectedMerchantName, availableStoresCount } = useMerchantStatsSession();

  const headingParts: string[] = [];
  if (selectedMerchantName) {
    headingParts.push(selectedMerchantName);
  }
  if (storeScope === "network" && availableStoresCount > 0) {
    headingParts.push(
      t("MerchantStats.hubStoreCount", {
        count: availableStoresCount,
      }),
    );
  }
  const headingSubtitle = headingParts.length > 0 ? headingParts.join(" · ") : null;

  const topContent = (
    <StatsScreenHeading title={t("Company.stats")} subtitle={headingSubtitle} />
  );

  return (
    <MerchantStatsScrollShell
      topContent={topContent}
      bundleContent={(bundle) => <MerchantStatsHub bundle={bundle} />}
    />
  );
}
