import { PermissionGate } from "@/components/atoms/PermissionGate";
import { SectionSeparator } from "@/components/atoms/SectionSeparator";
import { CouponCard } from "@/components/molecules/CouponCard";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { LoyaltyProgramSection } from "@/components/molecules/LoyaltyProgramSection";
import { OrderQueueTicketPreview } from "@/components/molecules/OrderQueueTicketPreview";
import { PointsCard } from "@/components/molecules/PointsCard";
import { StampCard } from "@/components/molecules/StampCard";
import type { DashboardFeature } from "@/constants/operatorPermissions";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useGetMerchantPointsProgram } from "@/hooks/graphql/queries/useGetMerchantPointsProgram";
import { useGetMyMerchantCoupons } from "@/hooks/graphql/queries/useGetMyMerchantCoupons";
import { useGetMyStampCardTemplates } from "@/hooks/graphql/queries/useGetMyStampCardTemplates";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

type LoyaltySetupFeature = "stamps" | "pointsProgram" | "coupons" | "orderQueue";

const LOYALTY_SETUP_SECTION_ORDER: Record<LoyaltySetupFeature, number> = {
  stamps: 0,
  pointsProgram: 1,
  coupons: 2,
  orderQueue: 3,
};

const loyaltySetupPermissionFeature = (
  feature: LoyaltySetupFeature,
): DashboardFeature => (feature === "orderQueue" ? "store" : feature);

export default function LoyaltySetupScreen() {
  const { t } = useTranslation();
  const { selectedMerchantId, availableStores } = useOperatorAccess();
  const { canRead: canAccessStamps, canWrite: canWriteStamps } = useFeatureAccess("stamps");
  const { canRead: canAccessPointsProgram, canWrite: canWritePointsProgram } = useFeatureAccess("pointsProgram");
  const { canRead: canAccessCoupons, canWrite: canWriteCoupons } = useFeatureAccess("coupons");
  const { canRead: canAccessStore, canWrite: canWriteStore } = useFeatureAccess("store");
  const merchantId = selectedMerchantId ?? undefined;
  const { data: stampCardTemplatesData } = useGetMyStampCardTemplates({
    skip: !canAccessStamps,
  });
  const { data: pointsProgramData } = useGetMerchantPointsProgram({
    merchantId,
    skip: !canAccessPointsProgram || !merchantId,
  });
  const { merchantCoupons } = useGetMyMerchantCoupons({
    skip: !canAccessCoupons,
    storeId: null,
  });
  const stampCardTemplateId = stampCardTemplatesData?.myStampCardTemplates?.[0]?.id;
  const hasStampCardTemplate = Boolean(stampCardTemplateId);
  const canOpenStamps = canWriteStamps || hasStampCardTemplate;
  const hasPointsProgram = Boolean(pointsProgramData?.getMerchantPointsProgram?.id);
  const hasMerchantCoupons = merchantCoupons.length > 0;
  const canOpenPointsProgram = canWritePointsProgram || hasPointsProgram;
  const hasConfiguredOrderQueue =
    canAccessStore &&
    availableStores.some((store) => store.orderQueueSettings != null);
  const canOpenOrderQueue = canWriteStore || hasConfiguredOrderQueue;
  const hasConfiguredProgram =
    (canAccessStamps && hasStampCardTemplate) ||
    (canAccessPointsProgram && hasPointsProgram) ||
    (canAccessStore && hasConfiguredOrderQueue);
  const stampsButtonText = hasStampCardTemplate
    ? t("Loyalty.editLoyaltyProgram")
    : t("Loyalty.createLoyaltyProgram");
  const pointsButtonText = hasPointsProgram
    ? t("Loyalty.editLoyaltyProgram")
    : t("Loyalty.createLoyaltyProgram");
  const orderQueueButtonText = hasConfiguredOrderQueue
    ? t("Loyalty.editOrderQueue")
    : t("Loyalty.configureOrderQueue");

  const handleStampsPress = () => {
    if (!canOpenStamps) {
      return;
    }
    if (stampCardTemplateId) {
      router.push({
        pathname: "/company/stamp-card-template",
        params: {
          mode: "edit",
          templateId: stampCardTemplateId,
        },
      });
      return;
    }
    router.push("/company/stamp-card-template");
  };

  const handlePointsPress = () => {
    if (!canOpenPointsProgram) {
      return;
    }
    router.push("/company/points-program/form");
  };

  const handleCouponsPress = () => {
    if (!canWriteCoupons) {
      return;
    }
    router.push("/company/coupons/form");
  };

  const handleOrderQueuePress = () => {
    if (!canOpenOrderQueue) {
      return;
    }
    router.push("/company/store/order-queue");
  };

  const loyaltySetupSectionsUnsorted: {
    feature: LoyaltySetupFeature;
    configured: boolean;
    content: React.ReactNode;
  }[] = [
    {
      feature: "stamps",
      configured: hasStampCardTemplate,
      content: (
        <>
          <LoyaltyProgramSection
            title={t("Loyalty.stampsForVisits")}
            buttonText={stampsButtonText}
            buttonDisabled={!canOpenStamps}
            onButtonPress={handleStampsPress}
            infoText={t("Loyalty.awardStampsDescription")}
            secondInfoText={t("Loyalty.chooseRewardDescription")}
            exampleCard={
              <StampCard
                title={t("Loyalty.stampCardTitle")}
                progress={t("Loyalty.stampCardProgress")}
                description={t("Loyalty.stampCardDescription")}
                rateText={t("Loyalty.stampCardRate")}
                totalStamps={8}
                filledStamps={3}
              />
            }
          />
          <SectionSeparator />
        </>
      ),
    },
    {
      feature: "pointsProgram",
      configured: hasPointsProgram,
      content: (
        <>
          <LoyaltyProgramSection
            title={t("Loyalty.pointsForAmount")}
            buttonText={pointsButtonText}
            buttonDisabled={!canOpenPointsProgram}
            onButtonPress={handlePointsPress}
            infoText={t("Loyalty.awardPointsDescription")}
            secondInfoText={t("Loyalty.createRewardsDescription")}
            exampleCard={
              <PointsCard
                points={t("Loyalty.pointsCardPoints")}
                rateText={t("Loyalty.pointsCardRate")}
              />
            }
          />
          <SectionSeparator />
        </>
      ),
    },
    {
      feature: "coupons",
      configured: hasMerchantCoupons,
      content: (
        <>
          <LoyaltyProgramSection
            title={t("Loyalty.hotCoupons")}
            buttonText={t("Loyalty.createHotCoupon")}
            buttonDisabled={!canWriteCoupons}
            onButtonPress={handleCouponsPress}
            infoText={t("Loyalty.encourageCustomersDescription")}
            exampleCard={
              <CouponCard
                discountText={t("Loyalty.couponCardDiscount")}
                title={t("Loyalty.couponCardTitle")}
              />
            }
          />
          <SectionSeparator />
        </>
      ),
    },
    {
      feature: "orderQueue",
      configured: hasConfiguredOrderQueue,
      content: (
        <>
          <LoyaltyProgramSection
            title={t("Loyalty.orderQueueTitle")}
            buttonText={orderQueueButtonText}
            buttonDisabled={!canOpenOrderQueue}
            onButtonPress={handleOrderQueuePress}
            infoText={t("Loyalty.orderQueueDescription")}
            secondInfoText={t("Loyalty.orderQueueSecondDescription")}
            exampleCard={
              <OrderQueueTicketPreview
                orderNumber={24}
                statusLabel={t("OrderQueue.statusReadyToCollect")}
                pickupPlaceLabel={t("OrderQueue.pickupVenueFallback")}
                pickupPlaceName={t("Loyalty.orderQueuePreviewVenueExample")}
              />
            }
          />
          <SectionSeparator />
        </>
      ),
    },
  ];

  const loyaltySetupSections = [...loyaltySetupSectionsUnsorted].sort((a, b) => {
    if (a.configured !== b.configured) {
      return Number(a.configured) - Number(b.configured);
    }
    return LOYALTY_SETUP_SECTION_ORDER[a.feature] - LOYALTY_SETUP_SECTION_ORDER[b.feature];
  });

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 23, overflow: "visible" }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-4 overflow-visible p-4 px-6 pb-5.75">
        {!hasConfiguredProgram && (
          <InfoBanner text={t("Loyalty.configureAtLeastOne")} />
        )}

        {loyaltySetupSections.map(({ feature, content }) => (
          <PermissionGate key={feature} feature={loyaltySetupPermissionFeature(feature)}>
            {content}
          </PermissionGate>
        ))}
      </View>
    </ScrollView>
  );
}
