import type {
  DashboardCounts,
  DashboardFeatureAccess,
} from "@/hooks/useDashboardData";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type DashboardMenuItemConfig = {
  key: string;
  label: string;
  count?: number;
  disabled?: boolean;
  onPress?: () => void;
};

type DashboardMenuItemWithVisibility = DashboardMenuItemConfig & {
  visible: boolean;
};

type UseDashboardMenuItemsParams = {
  isAdmin: boolean;
  featureAccess: DashboardFeatureAccess;
  counts: DashboardCounts;
  firstStampTemplateId?: string;
  hasPointsProgram: boolean;
};

export const useDashboardMenuItems = ({
  isAdmin,
  featureAccess,
  counts,
  firstStampTemplateId,
  hasPointsProgram,
}: UseDashboardMenuItemsParams) => {
  const { t } = useTranslation();
  const { canWrite: canWriteStamps } = useFeatureAccess("stamps");
  const { canWrite: canWritePointsProgram } = useFeatureAccess("pointsProgram");

  const canOpenStamps = canWriteStamps || Boolean(firstStampTemplateId);
  const canOpenPointsProgram = canWritePointsProgram || hasPointsProgram;

  const handleStampsPress = useCallback(() => {
    if (!canOpenStamps) {
      return;
    }
    if (firstStampTemplateId) {
      router.push({
        pathname: "/company/stamp-card-template",
        params: { mode: "edit", templateId: firstStampTemplateId },
      });
      return;
    }
    router.push("/company/stamp-card-template");
  }, [canOpenStamps, firstStampTemplateId]);

  const handlePointsProgramPress = useCallback(() => {
    if (!canOpenPointsProgram) {
      return;
    }
    router.push("/company/points-program/form");
  }, [canOpenPointsProgram]);

  const menuItems = useMemo<DashboardMenuItemWithVisibility[]>(
    () => [
      {
        key: "store",
        label: t("Company.salesPoints"),
        count: counts.stores,
        visible: featureAccess.store,
        onPress: () => router.push("/company/store"),
      },
      {
        key: "orderQueue",
        label: t("Company.orderQueue"),
        visible: featureAccess.store,
        onPress: () => router.push("/company/store/order-queue"),
      },
      {
        key: "nipData",
        label: t("Company.nipData"),
        visible: isAdmin,
        onPress: () => router.push("/company/data"),
      },
      {
        key: "merchantProfile",
        label: t("Company.editMerchant"),
        visible: featureAccess.merchant,
        onPress: () => router.push("/company/merchant"),
      },
      {
        key: "loyaltyConfig",
        label: t("Company.loyaltyProgramsConfiguration"),
        count: counts.configuredPrograms,
        visible: featureAccess.loyaltyConfiguration,
        onPress: () => router.push("/company/onboarding/loyalty-setup"),
      },
      {
        key: "coupons",
        label: t("Company.coupons"),
        count: counts.coupons,
        visible: featureAccess.coupons,
        onPress: () => router.push("/company/coupons"),
      },
      {
        key: "rewards",
        label: t("Company.rewards"),
        count: counts.rewards,
        visible: featureAccess.rewards,
        onPress: () => router.push("/company/rewards"),
      },
      {
        key: "stamps",
        label: t("Company.stamps"),
        count: counts.stamps,
        visible: featureAccess.stamps,
        disabled: !canOpenStamps,
        onPress: handleStampsPress,
      },
      {
        key: "pointsProgram",
        label: t("Company.pointsProgram"),
        count: counts.pointsProgram,
        visible: featureAccess.pointsProgram,
        disabled: !canOpenPointsProgram,
        onPress: handlePointsProgramPress,
      },
      {
        key: "streaks",
        label: t("Company.streaks"),
        count: counts.streaks,
        visible: featureAccess.streaks,
        onPress: () => router.push("/company/streaks"),
      },
      {
        key: "stats",
        label: t("Company.stats"),
        visible: featureAccess.merchant,
        onPress: () => router.push("/company/stats"),
      },
      {
        key: "cooperators",
        label: t("Company.employeesAndPermissions"),
        visible: featureAccess.cooperators,
        onPress: () => router.push("/company/cooperators"),
      },
      {
        key: "vouchers",
        label: t("Company.vouchers"),
        visible: featureAccess.coupons,
      },
      {
        key: "sendNotification",
        label: t("Company.sendPromotionNotification"),
        visible: featureAccess.coupons,
      },
    ],
    [
      canOpenPointsProgram,
      canOpenStamps,
      counts,
      featureAccess,
      handlePointsProgramPress,
      handleStampsPress,
      isAdmin,
      t,
    ],
  );

  return menuItems
    .filter(
      (item): item is DashboardMenuItemWithVisibility & { visible: true } =>
        item.visible,
    )
    .map(({ visible: _visible, ...item }) => item);
};
