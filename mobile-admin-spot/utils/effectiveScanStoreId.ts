import type { OperatorAccessStore } from "@/hooks/useOperatorAccess/types";

export function effectiveScanStoreId(
  selectedScanStoreId: string | null,
  allStores: OperatorAccessStore[],
): string | null {
  if (selectedScanStoreId == null) {
    return null;
  }
  return allStores.some((s) => s.id === selectedScanStoreId) ? selectedScanStoreId : null;
}
