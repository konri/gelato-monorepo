import { SCOPE_MODE_LABEL_KEYS } from "@/constants/operatorPermissions";
import type { CooperatorInvitationStatus } from "@/shared/api-client/src/graphql/queries/cooperatorInvitations";
import type {
  AccessScopeMode,
  OperatorPermission,
} from "@/shared/api-client/src/graphql/types/operatorAccess";
import type { AccessConfigState, PermissionMatrixRow } from "./types";

export const sanitizeCooperatorPermissions = (
  permissions: readonly OperatorPermission[],
): OperatorPermission[] =>
  permissions.filter((p) => p !== "STAMP_TEMPLATE_OVERRIDE_WRITE");

export const DEFAULT_INVITE_PERMISSIONS: OperatorPermission[] = [
  "STORE_READ",
  "COUPON_READ",
  "REWARD_READ",
];

export const DEFAULT_ACCESS_CONFIG: AccessConfigState = {
  scopeMode: "STORE_SCOPED",
  selectedPermissions: DEFAULT_INVITE_PERMISSIONS,
  storeScopeAll: false,
  selectedStoreIds: [],
};

export const PERMISSION_MATRIX_ROWS: PermissionMatrixRow[] = [
  {
    featureLabelKey: "Cooperators.permissionRowMerchantProfile",
    readPermission: "MERCHANT_PROFILE_READ",
    globalPermission: "MERCHANT_PROFILE_WRITE",
  },
  {
    featureLabelKey: "Cooperators.permissionRowStores",
    readPermission: "STORE_READ",
    globalPermission: "STORE_WRITE",
  },
  {
    featureLabelKey: "Cooperators.permissionRowCoupons",
    readPermission: "COUPON_READ",
    globalPermission: "COUPON_BASE_WRITE",
    overridePermission: "COUPON_OVERRIDE_WRITE",
  },
  {
    featureLabelKey: "Cooperators.permissionRowRewards",
    readPermission: "REWARD_READ",
    globalPermission: "REWARD_BASE_WRITE",
    overridePermission: "REWARD_OVERRIDE_WRITE",
  },
  {
    featureLabelKey: "Cooperators.permissionRowStreaks",
    readPermission: "STREAK_READ",
    globalPermission: "STREAK_BASE_WRITE",
    overridePermission: "STREAK_OVERRIDE_WRITE",
  },
  {
    featureLabelKey: "Cooperators.permissionRowStampTemplates",
    readPermission: "STAMP_TEMPLATE_READ",
    globalPermission: "STAMP_TEMPLATE_BASE_WRITE",
  },
  {
    featureLabelKey: "Cooperators.permissionRowPointsProgram",
    readPermission: "POINTS_PROGRAM_READ",
    globalPermission: "POINTS_PROGRAM_WRITE",
  },
];

export const SCOPE_OPTIONS: { labelKey: string; value: AccessScopeMode }[] = [
  { labelKey: SCOPE_MODE_LABEL_KEYS.FULL_MERCHANT, value: "FULL_MERCHANT" },
  { labelKey: SCOPE_MODE_LABEL_KEYS.STORE_SCOPED, value: "STORE_SCOPED" },
];

export const INVITATION_STATUS_LABEL_KEYS: Record<CooperatorInvitationStatus, string> = {
  ACTIVE: "Cooperators.statusActive",
  ACCEPTED: "Cooperators.statusAccepted",
  REVOKED: "Cooperators.statusRevoked",
  EXPIRED: "Cooperators.statusExpired",
};

export const INVITATION_STATUS_PILL_STYLES: Record<
  CooperatorInvitationStatus,
  { containerClassName: string; textClassName: string }
> = {
  ACTIVE: {
    containerClassName: "border-green-200 bg-green-50",
    textClassName: "text-green-700",
  },
  ACCEPTED: {
    containerClassName: "border-blue-200 bg-blue-50",
    textClassName: "text-blue-900",
  },
  REVOKED: {
    containerClassName: "border-red-200 bg-red-50",
    textClassName: "text-red-500",
  },
  EXPIRED: {
    containerClassName: "border-gray-300 bg-gray-100",
    textClassName: "text-gray-700",
  },
};

export const STATUS_SORT_OPTIONS: {
  labelKey: string;
  value: CooperatorInvitationStatus | "";
}[] = [
  { labelKey: "Cooperators.statusAll", value: "" },
  { labelKey: INVITATION_STATUS_LABEL_KEYS.ACTIVE, value: "ACTIVE" },
  { labelKey: INVITATION_STATUS_LABEL_KEYS.ACCEPTED, value: "ACCEPTED" },
  { labelKey: INVITATION_STATUS_LABEL_KEYS.REVOKED, value: "REVOKED" },
  { labelKey: INVITATION_STATUS_LABEL_KEYS.EXPIRED, value: "EXPIRED" },
];
