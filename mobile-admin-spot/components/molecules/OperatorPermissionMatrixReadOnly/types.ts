import type { OperatorPermission } from "@/shared/api-client/src/graphql/types/operatorAccess";

export type OperatorPermissionMatrixReadOnlyProps = {
  permissions: readonly OperatorPermission[];
};
