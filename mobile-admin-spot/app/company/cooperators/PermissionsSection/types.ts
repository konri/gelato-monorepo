import type { OperatorPermission } from "@/shared/api-client/src/graphql/types/operatorAccess";

export type PermissionsSectionProps = {
  selectedPermissions: OperatorPermission[];
  onToggle: (permission: OperatorPermission) => void;
};
