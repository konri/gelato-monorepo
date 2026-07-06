import type {
  AccessScopeMode,
  OperatorPermission,
  OperatorScopeAccess,
} from "../../types/operatorAccess";

export type CooperatorInvitationStatus =
  | "ACTIVE"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type PreviewCooperatorInvitationStatus =
  | "VALID"
  | "NOT_FOUND"
  | "REVOKED"
  | "ACCEPTED"
  | "EXPIRED"
  | "MERCHANT_NOT_FOUND";

export type CooperatorInvitation = OperatorScopeAccess & {
  id: string;
  email: string;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

export type MyCooperatorInvitationsResponse = {
  myCooperatorInvitations: CooperatorInvitation[];
};

export type PreviewCooperatorInvitation = OperatorScopeAccess & {
  valid: boolean;
  status: PreviewCooperatorInvitationStatus;
  email?: string | null;
  merchantId?: string | null;
  merchantName?: string | null;
  scopeMode?: AccessScopeMode;
  permissions?: OperatorPermission[];
  storeScopeAll?: boolean;
  storeIds?: string[];
  expiresAt?: string | null;
};

export type PreviewCooperatorInvitationResponse = {
  previewCooperatorInvitation: PreviewCooperatorInvitation;
};
