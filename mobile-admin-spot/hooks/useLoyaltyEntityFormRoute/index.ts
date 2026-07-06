import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import type { LoyaltyEntityFormRouteInput, LoyaltyEntityFormRouteResult } from "./types";
import { resolveLoyaltyEntityFormRoute } from "./utils";

export type { LoyaltyEntityFormRouteInput, LoyaltyEntityFormRouteResult } from "./types";
export { resolveLoyaltyEntityFormRoute } from "./utils";

type UseLoyaltyEntityFormRouteOptions = Pick<
  LoyaltyEntityFormRouteInput,
  "entityId" | "selectedStoreId" | "canEditGlobal" | "canEditStoreOverrides"
>;

export function useLoyaltyEntityFormRoute(
  options: UseLoyaltyEntityFormRouteOptions,
): LoyaltyEntityFormRouteResult {
  const { loyaltyEditScope, overrideStoreId } = useLocalSearchParams<{
    loyaltyEditScope?: string;
    overrideStoreId?: string;
  }>();

  const { entityId, selectedStoreId, canEditGlobal, canEditStoreOverrides } = options;

  return useMemo(
    () =>
      resolveLoyaltyEntityFormRoute({
        entityId,
        loyaltyEditScope,
        overrideStoreId,
        selectedStoreId,
        canEditGlobal,
        canEditStoreOverrides,
      }),
    [
      entityId,
      loyaltyEditScope,
      overrideStoreId,
      selectedStoreId,
      canEditGlobal,
      canEditStoreOverrides,
    ],
  );
}
