import type { VendorOrderGraphql } from "@/shared/api-client/src/graphql/queries/activeOrders";
import { formatShortDateTime } from "@/utils/merchantStatsFormat";

export type VendorPickupMetaLines = {
  sourceDisplay: string;
  atDisplay: string;
};

export function buildVendorPickupMetaLines(
  order: VendorOrderGraphql,
  locale: string,
  emptyLabel: string,
  formatSourceLabel?: (code: string) => string,
): VendorPickupMetaLines {
  const rawSource =
    typeof order.pickedUpSource === "string" ? order.pickedUpSource.trim() : "";
  const rawAt =
    typeof order.pickedUpAt === "string" && order.pickedUpAt.length > 0 ? order.pickedUpAt : "";

  const sourceDisplay =
    rawSource.length > 0
      ? formatSourceLabel != null
        ? formatSourceLabel(rawSource)
        : rawSource
      : emptyLabel;

  const atDisplay = rawAt.length > 0 ? formatShortDateTime(rawAt, locale) : emptyLabel;

  return { sourceDisplay, atDisplay };
}
