import { FEATURE_PERMISSIONS } from "@/constants/operatorPermissions";
import { useGetMerchantPointsProgram } from "@/hooks/graphql/queries/useGetMerchantPointsProgram";
import { useGetMerchantStores } from "@/hooks/graphql/queries/useGetMerchantStores";
import { useGetMyMerchantCoupons } from "@/hooks/graphql/queries/useGetMyMerchantCoupons";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useGetMyRewards } from "@/hooks/graphql/queries/useGetMyRewards";
import { useGetMyStampCardTemplates } from "@/hooks/graphql/queries/useGetMyStampCardTemplates";
import { useGetMyStreakPrograms } from "@/hooks/graphql/queries/useGetMyStreakPrograms";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import type { OperatorPermission } from "@/shared/api-client/src/graphql/types/operatorAccess";
import { useCallback, useMemo } from "react";

export type DashboardFeatureAccess = {
  store: boolean;
  merchant: boolean;
  coupons: boolean;
  rewards: boolean;
  stamps: boolean;
  pointsProgram: boolean;
  streaks: boolean;
  cooperators: boolean;
  loyaltyConfiguration: boolean;
};

export type DashboardCounts = {
  stores: number;
  stamps?: number;
  rewards?: number;
  coupons?: number;
  streaks?: number;
  pointsProgram?: number;
  configuredPrograms?: number;
};

export const useDashboardData = () => {
  const {
    isComplete,
    isLoading: onboardingLoading,
    refetch: refetchOnboarding,
  } = useOnboardingStatus();

  const {
    selectedMerchantId,
    selectedStoreId,
    availableStores,
    hasAnyMerchantAccess,
    isOwner,
    hasPermission,
    isAdmin,
    isLoading: accessLoading,
    canEditMerchantProfile,
  } = useOperatorAccess();

  const featureAccess = useMemo<DashboardFeatureAccess>(() => {
    const check = (permissions: readonly OperatorPermission[]) =>
      permissions.some(hasPermission);
    const store = check(FEATURE_PERMISSIONS.store.read);
    const merchantProfileRead = check(FEATURE_PERMISSIONS.merchant.read);
    const merchantProfileWrite = check(FEATURE_PERMISSIONS.merchant.write);
    const merchant =
      merchantProfileRead || merchantProfileWrite || canEditMerchantProfile;
    const coupons = check(FEATURE_PERMISSIONS.coupons.read);
    const rewards = check(FEATURE_PERMISSIONS.rewards.read);
    const stamps = check(FEATURE_PERMISSIONS.stamps.read);
    const pointsProgram = check(FEATURE_PERMISSIONS.pointsProgram.read);
    const streaks = check(FEATURE_PERMISSIONS.streaks.read);
    const cooperators = check(FEATURE_PERMISSIONS.cooperators.read);
    const loyaltyConfiguration =
      coupons || rewards || stamps || pointsProgram || streaks;

    return {
      store,
      merchant,
      coupons,
      rewards,
      stamps,
      pointsProgram,
      streaks,
      cooperators,
      loyaltyConfiguration,
    };
  }, [canEditMerchantProfile, hasPermission]);

  const canAccessCompanyWorkspace = isComplete || (!isOwner && hasAnyMerchantAccess);

  const { data: merchantsData, refetch: refetchMerchants } = useGetMyMerchants({
    skip: !canAccessCompanyWorkspace || !featureAccess.merchant,
  });

  const { data: storesData, refetch: refetchStores } = useGetMerchantStores({
    skip: !canAccessCompanyWorkspace || !featureAccess.store,
  });

  const { data: stampsData, refetch: refetchStamps } =
    useGetMyStampCardTemplates({
      skip: !canAccessCompanyWorkspace || !featureAccess.stamps,
    });

  const { data: rewardsData, refetch: refetchRewards } = useGetMyRewards({
    skip: !canAccessCompanyWorkspace || !featureAccess.rewards,
  });

  const { data: couponsData, refetch: refetchCoupons } =
    useGetMyMerchantCoupons({
      skip: !canAccessCompanyWorkspace || !featureAccess.coupons,
    });

  const { data: streaksData, refetch: refetchStreaks } = useGetMyStreakPrograms(
    {
      skip: !canAccessCompanyWorkspace || !featureAccess.streaks,
    },
  );

  const currentMerchant = useMemo(
    () =>
      merchantsData?.myMerchants?.find((m) => m.id === selectedMerchantId) ??
      merchantsData?.myMerchants?.[0],
    [merchantsData?.myMerchants, selectedMerchantId],
  );

  const merchantId = selectedMerchantId ?? merchantsData?.myMerchants?.[0]?.id;

  const { data: pointsProgramData, refetch: refetchPointsProgram } =
    useGetMerchantPointsProgram({
      merchantId,
      skip:
        !canAccessCompanyWorkspace ||
        !featureAccess.pointsProgram ||
        !merchantId,
    });

  const currentStore = useMemo(
    () =>
      storesData?.myStores?.find((s) => s.id === selectedStoreId) ??
      storesData?.myStores?.find((s) => s.merchantId === selectedMerchantId) ??
      storesData?.myStores?.[0],
    [storesData?.myStores, selectedStoreId, selectedMerchantId],
  );

  const merchantHeader = useMemo(() => {
    const merchantCover = currentMerchant?.coverUrl;
    const storePhoto = currentStore?.photoUrl;
    const coverUri =
      selectedStoreId != null
        ? (storePhoto ?? merchantCover)
        : (merchantCover ?? storePhoto);
    return {
      name: currentMerchant?.name ?? currentStore?.name,
      logoUri: currentMerchant?.logoUrl,
      coverUri,
    };
  }, [currentMerchant, currentStore, selectedStoreId]);

  const stampTemplates = stampsData?.myStampCardTemplates;
  const firstStampTemplateId = stampTemplates?.[0]?.id;
  const hasStampTemplates = Boolean(stampTemplates?.length);
  const hasPointsProgram = Boolean(
    pointsProgramData?.getMerchantPointsProgram?.id,
  );
  const hasMerchantCoupons =
    (couponsData?.myMerchantCoupons?.length ?? 0) > 0;
  const hasStreakPrograms =
    (streaksData?.myMerchantStreaks?.length ?? 0) > 0;
  const hasConfiguredOrderQueue = (storesData?.myStores ?? []).some(
    (store) => store.orderQueueSettings != null,
  );
  const hasConfiguredLoyaltyProgram =
    (featureAccess.stamps && hasStampTemplates) ||
    (featureAccess.pointsProgram && hasPointsProgram) ||
    (featureAccess.coupons && hasMerchantCoupons) ||
    (featureAccess.streaks && hasStreakPrograms) ||
    (featureAccess.store && hasConfiguredOrderQueue);

  const counts = useMemo<DashboardCounts>(
    () => ({
      stores: availableStores.length,
      stamps: stampTemplates?.length,
      rewards: rewardsData?.myRewards?.length,
      coupons: couponsData?.myMerchantCoupons?.length,
      streaks: streaksData?.myMerchantStreaks?.length,
      pointsProgram: hasPointsProgram ? 1 : undefined,
      configuredPrograms:
        (hasStampTemplates ? 1 : 0) + (hasPointsProgram ? 1 : 0) || undefined,
    }),
    [
      availableStores.length,
      stampTemplates?.length,
      rewardsData?.myRewards?.length,
      couponsData?.myMerchantCoupons?.length,
      streaksData?.myMerchantStreaks?.length,
      hasPointsProgram,
      hasStampTemplates,
    ],
  );

  const showLoyaltyConfigBanner =
    isComplete &&
    featureAccess.loyaltyConfiguration &&
    !hasConfiguredLoyaltyProgram;

  const refreshAction = useCallback(async () => {
    await refetchOnboarding();
    if (!canAccessCompanyWorkspace) {
      return;
    }
    const tasks: Promise<unknown>[] = [];
    if (featureAccess.merchant) tasks.push(refetchMerchants());
    if (featureAccess.store) tasks.push(refetchStores());
    if (featureAccess.pointsProgram && merchantId)
      tasks.push(refetchPointsProgram({ merchantId }));
    if (featureAccess.stamps) tasks.push(refetchStamps());
    if (featureAccess.coupons) tasks.push(refetchCoupons());
    if (featureAccess.rewards) tasks.push(refetchRewards());
    if (featureAccess.streaks) tasks.push(refetchStreaks());
    await Promise.all(tasks);
  }, [
    canAccessCompanyWorkspace,
    featureAccess,
    merchantId,
    refetchOnboarding,
    refetchMerchants,
    refetchStores,
    refetchPointsProgram,
    refetchStamps,
    refetchCoupons,
    refetchRewards,
    refetchStreaks,
  ]);

  const { refreshing, onRefresh } = usePullToRefresh(refreshAction);

  return {
    isLoading: onboardingLoading || accessLoading,
    isAdmin,
    canAccessCompanyWorkspace,
    featureAccess,
    merchantHeader,
    counts,
    firstStampTemplateId,
    hasPointsProgram,
    showLoyaltyConfigBanner,
    refreshing,
    onRefresh,
  };
};
