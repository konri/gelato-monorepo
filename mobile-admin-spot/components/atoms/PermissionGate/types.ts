import type { DashboardFeature } from "@/constants/operatorPermissions";
import type { ReactNode } from "react";

export type PermissionGateProps = {
  feature: DashboardFeature;
  mode?: "read" | "write";
  children: ReactNode;
  fallback?: ReactNode;
};
