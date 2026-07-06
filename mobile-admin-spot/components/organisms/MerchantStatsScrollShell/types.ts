import type { MerchantStatsBundleData } from "@/shared/api-client/src/graphql/queries/merchantStats";
import type { ReactNode } from "react";

export type MerchantStatsScrollShellProps = {
  topContent?: ReactNode;
  bundleContent: (bundle: MerchantStatsBundleData) => ReactNode;
  footerContent?: ReactNode;
};
