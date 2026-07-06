import type {
  AccessScopeMode,
  OperatorPermission,
} from "@/shared/api-client/src/graphql/types/operatorAccess";

export const SCOPE_MODE_LABEL_KEYS: Record<AccessScopeMode, string> = {
  FULL_MERCHANT: "Cooperators.fullMerchantScope",
  STORE_SCOPED: "Cooperators.storeScoped",
};

export const OPERATOR_PERMISSION_LABEL_KEYS: Record<OperatorPermission, string> = {
  MERCHANT_PROFILE_READ: "OperatorPermissions.merchantProfileRead",
  MERCHANT_PROFILE_WRITE: "OperatorPermissions.merchantProfileWrite",
  STORE_READ: "OperatorPermissions.storeRead",
  STORE_WRITE: "OperatorPermissions.storeWrite",
  COUPON_READ: "OperatorPermissions.couponRead",
  COUPON_BASE_WRITE: "OperatorPermissions.couponBaseWrite",
  COUPON_OVERRIDE_WRITE: "OperatorPermissions.couponOverrideWrite",
  REWARD_READ: "OperatorPermissions.rewardRead",
  REWARD_BASE_WRITE: "OperatorPermissions.rewardBaseWrite",
  REWARD_OVERRIDE_WRITE: "OperatorPermissions.rewardOverrideWrite",
  STREAK_READ: "OperatorPermissions.streakRead",
  STREAK_BASE_WRITE: "OperatorPermissions.streakBaseWrite",
  STREAK_OVERRIDE_WRITE: "OperatorPermissions.streakOverrideWrite",
  STAMP_TEMPLATE_READ: "OperatorPermissions.stampTemplateRead",
  STAMP_TEMPLATE_BASE_WRITE: "OperatorPermissions.stampTemplateBaseWrite",
  STAMP_TEMPLATE_OVERRIDE_WRITE: "OperatorPermissions.stampTemplateOverrideWrite",
  POINTS_PROGRAM_READ: "OperatorPermissions.pointsProgramRead",
  POINTS_PROGRAM_WRITE: "OperatorPermissions.pointsProgramWrite",
};

export const ALL_OPERATOR_PERMISSIONS = Object.keys(
  OPERATOR_PERMISSION_LABEL_KEYS,
) as OperatorPermission[];

export const FEATURE_PERMISSIONS = {
  store: {
    read: ["STORE_READ"],
    write: ["STORE_WRITE"],
  },
  merchant: {
    read: ["MERCHANT_PROFILE_READ"],
    write: ["MERCHANT_PROFILE_WRITE"],
  },
  coupons: {
    read: ["COUPON_READ"],
    write: ["COUPON_BASE_WRITE", "COUPON_OVERRIDE_WRITE"],
  },
  rewards: {
    read: ["REWARD_READ"],
    write: ["REWARD_BASE_WRITE", "REWARD_OVERRIDE_WRITE"],
  },
  stamps: {
    read: ["STAMP_TEMPLATE_READ"],
    write: ["STAMP_TEMPLATE_BASE_WRITE"],
  },
  pointsProgram: {
    read: ["POINTS_PROGRAM_READ"],
    write: ["POINTS_PROGRAM_WRITE"],
  },
  streaks: {
    read: ["STREAK_READ"],
    write: ["STREAK_BASE_WRITE", "STREAK_OVERRIDE_WRITE"],
  },
  cooperators: {
    read: ["MERCHANT_PROFILE_WRITE"],
    write: ["MERCHANT_PROFILE_WRITE"],
  },
} as const satisfies Record<
  string,
  {
    read: readonly OperatorPermission[];
    write: readonly OperatorPermission[];
  }
>;

export type DashboardFeature = keyof typeof FEATURE_PERMISSIONS;
