import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { PermissionGateProps } from "./types";

export const PermissionGate = ({
  feature,
  mode = "read",
  children,
  fallback = null,
}: PermissionGateProps) => {
  const { canRead, canWrite } = useFeatureAccess(feature);
  const hasAccess = mode === "read" ? canRead : canWrite;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
