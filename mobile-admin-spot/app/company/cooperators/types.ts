import type {
  AccessScopeMode,
  OperatorPermission,
} from "@/shared/api-client/src/graphql/types/operatorAccess";

export type AccessConfigState = {
  scopeMode: AccessScopeMode;
  selectedPermissions: OperatorPermission[];
  storeScopeAll: boolean;
  selectedStoreIds: string[];
};

export type PermissionMatrixRow = {
  featureLabelKey: string;
  readPermission?: OperatorPermission;
  globalPermission?: OperatorPermission;
  overridePermission?: OperatorPermission;
};
