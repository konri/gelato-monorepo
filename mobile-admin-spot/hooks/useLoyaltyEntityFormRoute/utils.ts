import type {
  LoyaltyEntityFormRouteInput,
  LoyaltyEntityFormRouteResult,
} from "./types";

export function resolveLoyaltyEntityFormRoute(
  input: LoyaltyEntityFormRouteInput,
): LoyaltyEntityFormRouteResult {
  const {
    entityId,
    loyaltyEditScope,
    overrideStoreId: rawOverrideStoreId,
    selectedStoreId,
    canEditGlobal,
    canEditStoreOverrides,
  } = input;

  const isEditMode = typeof entityId === "string" && entityId.length > 0;
  const overrideStoreId =
    typeof rawOverrideStoreId === "string" && rawOverrideStoreId.length > 0
      ? rawOverrideStoreId
      : undefined;

  const isStoreOverrideEdit =
    isEditMode &&
    loyaltyEditScope === "storeOverride" &&
    overrideStoreId !== undefined;

  const isStoreContextCreate = !isEditMode && typeof selectedStoreId === "string";

  const canMutate = isStoreOverrideEdit
    ? canEditStoreOverrides
    : isStoreContextCreate
      ? canEditStoreOverrides
      : canEditGlobal;

  const resolvedStoreId = isStoreOverrideEdit
    ? overrideStoreId
    : selectedStoreId == null
      ? undefined
      : selectedStoreId;

  const scopeCreateStoreId =
    !isEditMode && typeof selectedStoreId === "string" ? selectedStoreId : undefined;

  return {
    isEditMode,
    isStoreOverrideEdit,
    isStoreContextCreate,
    canMutate,
    resolvedStoreId,
    overrideStoreId,
    scopeCreateStoreId,
  };
}
