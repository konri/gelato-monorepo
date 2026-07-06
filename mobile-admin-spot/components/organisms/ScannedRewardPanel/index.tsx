import { Carousel } from "@/components/atoms/Carousel";
import { ClientPointsSection } from "@/components/molecules/ClientPointsSection";
import { ClientStampCardSection } from "@/components/molecules/ClientStampCardSection";
import { OrderQueueScanAssignCard } from "@/components/molecules/OrderQueueScanAssignCard";
import { useAddStampByUserId } from "@/hooks/graphql/mutations/useAddStampByUserId";
import { useGetMyStampCardTemplates } from "@/hooks/graphql/queries/useGetMyStampCardTemplates";
import { useClientPointsSectionModel } from "@/hooks/useClientPointsSectionModel";
import { useKeyboardAwareBottomSheetScroll } from "@/hooks/useKeyboardAwareBottomSheetScroll";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { useRewardPanelData } from "@/hooks/useRewardPanelData";
import {
  GET_AVAILABLE_REWARDS_QUERY,
  GET_USER_CLAIMED_REWARDS_QUERY,
  GET_USER_STAMP_CARDS_QUERY,
  MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY,
} from "@/shared/api-client/src/graphql/queries/rewards";
import { effectiveScanStoreId } from "@/utils/effectiveScanStoreId";
import { isStampTemplateEarnableNow } from "@/utils/stampTemplateSchedule";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { CloseFlowRedeemModal } from "./CloseFlowRedeemModal";
import { LoadingErrorStates } from "./LoadingErrorStates";
import { RewardCarouselSection } from "./RewardCarouselSection";
import { StampCardSlide } from "./StampCardSlide";
import type { ScannedRewardPanelProps } from "./types";

export const ScannedRewardPanel = ({
  userId,
  venueSession,
  onClose,
  onBeforeCloseRef,
}: ScannedRewardPanelProps) => {
  const { t } = useTranslation();
  const { selectedScanStoreId, merchants, selectedMerchantId, stores } = useOperatorAccess();
  const { canWrite: canWriteStore } = useFeatureAccess("store");
  const storeId = effectiveScanStoreId(selectedScanStoreId, stores) ?? "";
  const scanStore = storeId ? stores.find((s) => s.id === storeId) : undefined;
  const showOrderQueueAssign =
    Boolean(storeId) && Boolean(scanStore?.orderQueueSettings);
  const rewardPanelUserId = userId ?? "";
  const hasIdentifiedCustomer = userId != null && userId.trim().length > 0;
  const merchantRecord =
    (scanStore ? merchants.find((m) => m.id === scanStore.merchantId) : undefined) ??
    merchants.find((m) => m.id === selectedMerchantId) ??
    merchants[0];
  const merchant = {
    id: merchantRecord?.id ?? "",
    logoUrl: merchantRecord?.logoUrl ?? null,
  };
  const [stampCount, setStampCount] = useState(1);
  const { scrollViewRef, keyboardExtraPadding, handleInputFocus, handleInputBlur } =
    useKeyboardAwareBottomSheetScroll();
  const [addStamp, { loading: addingStamp }] = useAddStampByUserId();
  const { isVisible: showClientPointsSection, model: clientPointsModel, handleAddPoints } =
    useClientPointsSectionModel({ userId: rewardPanelUserId });
  const { stampCards, carouselRewards, availableRewards, isLoading, hasError } = useRewardPanelData({
    userId: rewardPanelUserId,
    merchantLogoUrl: merchant.logoUrl,
  });
  const { data: stampTemplatesData, dataState: stampTemplatesState } = useGetMyStampCardTemplates();
  const hasMerchantActiveStampProgram = useMemo(() => {
    if (stampTemplatesState !== "complete" || !merchant.id) {
      return false;
    }
    return (stampTemplatesData?.myStampCardTemplates ?? []).some(
      (row) => row.merchantId === merchant.id && isStampTemplateEarnableNow(row),
    );
  }, [merchant.id, stampTemplatesData?.myStampCardTemplates, stampTemplatesState]);

  const handleAddStamps = async (count: number): Promise<boolean> => {
    if (count <= 0 || userId == null || !hasIdentifiedCustomer) {
      return false;
    }
    try {
      const result = await addStamp({
        variables: {
          userId,
          storeId,
          description: `Merchant added ${count} stamp(s)`,
          count,
        },
        awaitRefetchQueries: true,
        refetchQueries: [
          { query: MY_STAMP_CARDS_WITH_AVAILABLE_REWARDS_QUERY },
          { query: GET_AVAILABLE_REWARDS_QUERY, variables: { userId } },
          { query: GET_USER_STAMP_CARDS_QUERY, variables: { userId } },
          { query: GET_USER_CLAIMED_REWARDS_QUERY, variables: { userId } },
        ],
      });
      const added = result.data?.addStampByUserId;
      if (!added?.length) {
        return false;
      }
      setStampCount(1);
      return true;
    } catch {
      return false;
    }
  };

  if (hasError || isLoading) {
    return <LoadingErrorStates isLoading={isLoading} hasError={hasError} onClose={onClose} />;
  }

  return (
    <BottomSheetScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-4 gap-4" style={{ paddingBottom: 16 + keyboardExtraPadding }}>
        {showOrderQueueAssign ? (
          <OrderQueueScanAssignCard
            userId={userId ?? undefined}
            venueSession={venueSession}
            merchantStoreId={storeId}
            canSubmit={canWriteStore}
          />
        ) : null}

        {hasIdentifiedCustomer && carouselRewards.length > 0 && (
          <RewardCarouselSection
            userId={userId}
            rewards={carouselRewards}
            title={t("Rewards.realizeReward")}
          />
        )}

        {hasIdentifiedCustomer && availableRewards.length > 0 && (
          <RewardCarouselSection
            userId={userId}
            rewards={availableRewards}
            title={t("Rewards.availableRewards")}
            defaultExpanded={false}
            claimBeforeRedeem
          />
        )}

        <CloseFlowRedeemModal
          carouselRewards={carouselRewards}
          onClose={onClose}
          onBeforeCloseRef={onBeforeCloseRef}
        />

        {hasIdentifiedCustomer &&
          hasMerchantActiveStampProgram &&
          (stampCards.length > 0 ? (
            <Carousel
              data={stampCards}
              keyExtractor={(card) => card.id}
              renderItem={(card, index) => (
                <StampCardSlide
                  key={card.id}
                  card={card}
                  isNewest={index === 0}
                  stampCount={stampCount}
                  onStampCountChange={setStampCount}
                  onAddStamp={handleAddStamps}
                  isAddingStamp={addingStamp}
                  onSpentAmountFocus={handleInputFocus}
                  onSpentAmountBlur={handleInputBlur}
                />
              )}
            />
          ) : (
            <ClientStampCardSection
              stampAwardMode="visit"
              stampCount={stampCount}
              onStampCountChange={setStampCount}
              onAddStamp={handleAddStamps}
              addStampLabel={t("Rewards.addStampsCta", { count: stampCount })}
              assignStampsLabel={t("Rewards.assignStamps")}
              isAddingStamp={addingStamp}
            />
          ))}

        {showClientPointsSection && (
          <ClientPointsSection
            model={clientPointsModel}
            onSpentAmountFocus={handleInputFocus}
            onSpentAmountBlur={handleInputBlur}
            onAssignPoints={handleAddPoints}
          />
        )}
      </View>
    </BottomSheetScrollView>
  );
};
