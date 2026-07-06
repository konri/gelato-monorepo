export type AccessScopeMode = "FULL_MERCHANT" | "STORE_SCOPED";

export type OperatorPermission =
  | "MERCHANT_PROFILE_READ"
  | "MERCHANT_PROFILE_WRITE"
  | "STORE_READ"
  | "STORE_WRITE"
  | "COUPON_READ"
  | "COUPON_BASE_WRITE"
  | "COUPON_OVERRIDE_WRITE"
  | "REWARD_READ"
  | "REWARD_BASE_WRITE"
  | "REWARD_OVERRIDE_WRITE"
  | "STREAK_READ"
  | "STREAK_BASE_WRITE"
  | "STREAK_OVERRIDE_WRITE"
  | "STAMP_TEMPLATE_READ"
  | "STAMP_TEMPLATE_BASE_WRITE"
  | "STAMP_TEMPLATE_OVERRIDE_WRITE"
  | "POINTS_PROGRAM_READ"
  | "POINTS_PROGRAM_WRITE";

export type OperatorScopeAccess = {
  scopeMode: AccessScopeMode;
  permissions: OperatorPermission[];
  storeScopeAll: boolean;
  storeIds: string[];
};

export type MerchantOperatorEditCapabilities = {
  canEditMerchantBaseConfig: boolean;
  canEditCouponStoreOverrides: boolean;
  canEditRewardStoreOverrides: boolean;
  canEditStreakStoreOverrides: boolean;
  canEditGlobalCoupons: boolean;
  canEditGlobalRewards: boolean;
  canEditMerchantProfile: boolean;
  canEditGlobalStampTemplates: boolean;
  canEditGlobalStreaks: boolean;
  canEditMerchantPointsProgram: boolean;
};

export type MerchantOperatorScope = {
  merchantId: string;
  scopeMode: OperatorScopeAccess["scopeMode"];
  permissions: OperatorScopeAccess["permissions"];
  storeScopeAll: OperatorScopeAccess["storeScopeAll"];
  storeIds: OperatorScopeAccess["storeIds"];
  editCapabilities: MerchantOperatorEditCapabilities;
};

export type MyOperatorCapabilities = {
  roles: string[];
  isAdmin: boolean;
  isOwner: boolean;
  merchantScopes: MerchantOperatorScope[];
};
