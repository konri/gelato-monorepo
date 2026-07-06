import type { ReactNode } from "react";
import type { OperatorPermission } from "@/shared/api-client/src/graphql/types/operatorAccess";

export type OperatorPermissionMatrixProps =
  | {
      mode: "readOnly";
      granted: readonly OperatorPermission[];
      intro?: ReactNode;
    }
  | {
      mode: "editable";
      selectedPermissions: OperatorPermission[];
      onToggle: (permission: OperatorPermission) => void;
      intro?: ReactNode;
    };
