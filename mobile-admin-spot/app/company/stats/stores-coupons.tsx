import { MerchantStatsStoresCouponsView } from "@/components/organisms/MerchantStatsStoresCouponsView";
import { MerchantStatsScrollShell } from "@/components/organisms/MerchantStatsScrollShell";
import { useMerchantStatsSession } from "@/contexts/MerchantStatsSessionContext";
import { buildMerchantStatsLocationsSubtitle } from "@/utils/merchantStatsPeriod";
import { useTranslation } from "react-i18next";

export default function StatsStoresCouponsScreen() {
  const { t } = useTranslation();
  const { preset } = useMerchantStatsSession();

  return (
    <MerchantStatsScrollShell
      bundleContent={(bundle) => {
        const locCount = bundle.locations?.locations.length ?? 0;
        const subtitle = buildMerchantStatsLocationsSubtitle(t, preset, locCount);
        return <MerchantStatsStoresCouponsView bundle={bundle} screenSubtitle={subtitle} />;
      }}
    />
  );
}
