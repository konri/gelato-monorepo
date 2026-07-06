import {
  FEATURE_PERMISSIONS,
  type DashboardFeature,
} from "@/constants/operatorPermissions";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";

export const useFeatureAccess = (feature: DashboardFeature) => {
  const { hasPermission } = useOperatorAccess();
  const config = FEATURE_PERMISSIONS[feature];

  return {
    canRead: config.read.some(hasPermission),
    canWrite: config.write.some(hasPermission),
  };
};
