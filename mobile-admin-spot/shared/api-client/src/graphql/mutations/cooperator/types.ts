import type {
  AccessScopeMode,
  OperatorPermission,
  OperatorScopeAccess,
} from "../../types/operatorAccess";
import type { CooperatorInvitation } from "../../queries/cooperatorInvitations";

export type CreateCooperatorInvitationInput = {
  email: string;
  scopeMode: AccessScopeMode;
  permissions: OperatorPermission[];
  storeScopeAll: boolean;
  storeIds?: string[];
  expiresInHours?: number;
};

export type CreateCooperatorInvitationResponse = {
  createCooperatorInvitation: {
    webUrl: string;
    deeplinkUrl: string;
    invitation: CooperatorInvitation;
  };
};

export type RevokeCooperatorInvitationResponse = {
  revokeCooperatorInvitation: {
    id: string;
    revokedAt: string;
  };
};

export type AcceptCooperatorInvitationResponse = {
  acceptCooperatorInvitation: {
    token: string;
    cooperatorId: string;
    merchantId: string;
    merchantName: string;
  } & OperatorScopeAccess;
};

export type UpdateCooperatorAccessInput = {
  cooperatorId: string;
  scopeMode: OperatorScopeAccess["scopeMode"];
  permissions: OperatorScopeAccess["permissions"];
  storeScopeAll: OperatorScopeAccess["storeScopeAll"];
  storeIds?: string[];
};

export type UpdateCooperatorAccessResponse = {
  updateCooperatorAccess: {
    id: string;
    scopeMode: OperatorScopeAccess["scopeMode"];
    permissions: OperatorScopeAccess["permissions"];
    storeScopeAll: OperatorScopeAccess["storeScopeAll"];
  };
};

export type DeleteCooperatorFromCompanyResponse = {
  deleteCooperatorFromCompany: {
    id: string;
  };
};

export type DeleteCooperatorFromCompanyVariables = {
  cooperatorId: string;
};
