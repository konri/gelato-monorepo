import type {
  MerchantOperatorEditCapabilities,
  MerchantOperatorScope,
} from "@/shared/api-client/src/graphql/types/operatorAccess";
import type { OperatorAccessStore, OperatorCapabilityFlags } from "./types";

const ACCESS_SCOPE_MODES: Record<MerchantOperatorScope["scopeMode"], true> = {
  FULL_MERCHANT: true,
  STORE_SCOPED: true,
};

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isAccessScopeMode = (value: unknown): value is MerchantOperatorScope["scopeMode"] =>
  typeof value === "string" && value in ACCESS_SCOPE_MODES;

const hasRequiredKeys = <K extends string>(
  obj: object,
  keys: readonly K[],
): obj is Record<K, unknown> => keys.every((key) => key in obj);

const OPERATOR_SCOPE_BASE_KEYS = [
  "merchantId",
  "scopeMode",
  "permissions",
  "storeScopeAll",
  "storeIds",
  "editCapabilities",
] as const;

const OPERATOR_CAPABILITY_FLAG_KEYS = [
  "canEditMerchantBaseConfig",
  "canEditCouponStoreOverrides",
  "canEditRewardStoreOverrides",
  "canEditStreakStoreOverrides",
  "canEditGlobalCoupons",
  "canEditGlobalRewards",
  "canEditMerchantProfile",
  "canEditGlobalStampTemplates",
  "canEditGlobalStreaks",
  "canEditMerchantPointsProgram",
] as const satisfies readonly (keyof MerchantOperatorEditCapabilities)[];

const isMerchantOperatorEditCapabilities = (
  value: unknown,
): value is MerchantOperatorEditCapabilities => {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (!hasRequiredKeys(value, OPERATOR_CAPABILITY_FLAG_KEYS)) {
    return false;
  }
  return OPERATOR_CAPABILITY_FLAG_KEYS.every(
    (key) => typeof (value as Record<string, unknown>)[key] === "boolean",
  );
};

export const isOperatorScope = (value: unknown): value is MerchantOperatorScope => {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (!hasRequiredKeys(value, OPERATOR_SCOPE_BASE_KEYS)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    isNonEmptyString(v.merchantId) &&
    isAccessScopeMode(v.scopeMode) &&
    isStringArray(v.permissions) &&
    typeof v.storeScopeAll === "boolean" &&
    isStringArray(v.storeIds) &&
    isMerchantOperatorEditCapabilities(v.editCapabilities)
  );
};

export const getScopeForMerchant = (
  scopes: MerchantOperatorScope[],
  merchantId: string | null,
) => {
  if (!merchantId) {
    return null;
  }
  return scopes.find((scope) => scope.merchantId === merchantId) ?? null;
};

export type ScopeAndAvailableStores = {
  currentScope: MerchantOperatorScope | null;
  availableStores: OperatorAccessStore[];
};

export const resolveScopeAndAvailableStores = (
  merchantScopes: MerchantOperatorScope[],
  selectedMerchantId: string | null,
  stores: OperatorAccessStore[],
): ScopeAndAvailableStores => {
  const currentScope = getScopeForMerchant(merchantScopes, selectedMerchantId);
  if (!currentScope || currentScope.scopeMode === "FULL_MERCHANT") {
    const availableStores = selectedMerchantId
      ? stores.filter((store) => store.merchantId === selectedMerchantId)
      : stores;
    return { currentScope, availableStores };
  }
  const merchantFiltered = stores.filter(
    (store) => store.merchantId === selectedMerchantId,
  );
  const availableStores = currentScope.storeScopeAll
    ? merchantFiltered
    : merchantFiltered.filter((store) => currentScope.storeIds.includes(store.id));
  return { currentScope, availableStores };
};

export const resolveOperatorCapabilityFlags = (
  scope: MerchantOperatorScope | null,
): OperatorCapabilityFlags =>
  Object.fromEntries(
    OPERATOR_CAPABILITY_FLAG_KEYS.map((key) => [
      key,
      scope ? scope.editCapabilities[key] : false,
    ]),
  ) as OperatorCapabilityFlags;