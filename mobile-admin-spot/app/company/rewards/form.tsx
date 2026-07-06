import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { DeleteButton } from "@/components/molecules/DeleteButton";
import { LoyaltyEntityFormHeaderBlock } from "@/components/molecules/LoyaltyEntityFormHeaderBlock";
import { LoyaltyEntityFormLoadingScreen } from "@/components/molecules/LoyaltyEntityFormLoadingScreen";
import { RewardForm } from "@/components/organisms/RewardForm";
import { useCreateReward } from "@/hooks/graphql/mutations/useCreateReward";
import { useDeleteReward } from "@/hooks/graphql/mutations/useDeleteReward";
import { useUpdateReward } from "@/hooks/graphql/mutations/useUpdateReward";
import { useUpsertRewardStoreOverride } from "@/hooks/graphql/mutations/useUpsertRewardStoreOverride";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useGetMyRewards } from "@/hooks/graphql/queries/useGetMyRewards";
import { useLoyaltyEntityFormRoute } from "@/hooks/useLoyaltyEntityFormRoute";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { RewardFormData } from "@/utils/rewardForm";
import { executeRewardFormMutations } from "@/utils/rewardFormSubmit";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export default function RewardFormScreen() {
  const { t } = useTranslation();
  const { rewardId } = useLocalSearchParams<{ rewardId?: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    selectedMerchantId,
    selectedStoreId,
    canEditGlobalRewards,
    canEditRewardStoreOverrides,
    merchants: operatorMerchants,
  } = useOperatorAccess();
  const {
    isEditMode,
    isStoreOverrideEdit,
    isStoreContextCreate,
    canMutate: canEditReward,
    resolvedStoreId,
    overrideStoreId,
    scopeCreateStoreId,
  } = useLoyaltyEntityFormRoute({
    entityId: rewardId,
    selectedStoreId,
    canEditGlobal: canEditGlobalRewards,
    canEditStoreOverrides: canEditRewardStoreOverrides,
  });
  const { data: merchantsData } = useGetMyMerchants();

  const { data: myRewardsData, loading: myRewardsLoading } = useGetMyRewards({
    storeId: resolvedStoreId,
  });

  const reward = (myRewardsData?.myRewards ?? []).find(
    (r) => r.id === rewardId,
  );

  const [createReward] = useCreateReward();
  const [updateReward] = useUpdateReward();
  const [upsertRewardStoreOverride] = useUpsertRewardStoreOverride();
  const [deleteReward, { loading: isDeleting }] = useDeleteReward();

  const initialData = useMemo<Partial<RewardFormData> | undefined>(() => {
    if (!reward) return undefined;
    return {
      title: reward.title,
      description: reward.description ?? "",
      imageUrl: reward.imageUrl ?? "",
      valueType: reward.valueType,
      discountPercent: reward.discountPercent?.toString(),
      discountAmount: reward.discountAmount?.toString(),
      pointsValue: reward.pointsValue?.toString(),
    };
  }, [reward]);

  const merchantId = isEditMode
    ? reward?.merchant?.id
    : (selectedMerchantId ??
      myRewardsData?.myRewards?.[0]?.merchant?.id ??
      merchantsData?.myMerchants?.[0]?.id);

  const logoUrl = merchantId
    ? operatorMerchants.find((m) => m.id === merchantId)?.logoUrl
    : undefined;

  const handleSave = async (data: RewardFormData) => {
    if (!canEditReward || !merchantId) {
      return;
    }

    await executeRewardFormMutations({
      formValues: data,
      merchantId,
      rewardId,
      overrideStoreId,
      isStoreOverrideEdit,
      isEditMode,
      scopeCreateStoreId,
      createReward,
      updateReward,
      upsertRewardStoreOverride,
    });

    router.back();
  };

  const handleDeleteConfirm = async () => {
    if (!rewardId) return;
    try {
      await deleteReward({ variables: { id: rewardId } });
      setShowDeleteConfirm(false);
      router.back();
    } catch {
      setShowDeleteConfirm(false);
      Alert.alert(t("Common.error"), t("Loyalty.deleteRewardInUse"));
    }
  };

  if (isEditMode && myRewardsLoading) {
    return <LoyaltyEntityFormLoadingScreen />;
  }

  return (
    <>
      <KeyboardAwareScrollView
        className="flex-1 bg-gray-50-light"
        contentContainerClassName="p-6 gap-4"
        showsVerticalScrollIndicator={false}
      >
        <LoyaltyEntityFormHeaderBlock
          title={
            isEditMode ? t("Loyalty.editReward") : t("Loyalty.createReward")
          }
          headerActions={
            isEditMode && canEditGlobalRewards && !isStoreOverrideEdit ? (
              <DeleteButton
                onPress={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || !canEditReward}
              />
            ) : null
          }
          banner={
            isStoreOverrideEdit || isStoreContextCreate ? (
              <Typography
                variant="text-14-regular-spaced"
                className="text-blue-900"
              >
                {t("LoyaltyConfig.storeOverrideRewardBanner")}
              </Typography>
            ) : null
          }
        />

        <RewardForm
          logoUrl={logoUrl ?? undefined}
          initialData={initialData}
          onSave={handleSave}
          isEditMode={isEditMode}
          editable={canEditReward}
          imageOverrideResetKey={rewardId}
        />
      </KeyboardAwareScrollView>

      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title={t("Loyalty.deleteRewardTitle")}
        message={t("Loyalty.deleteRewardConfirmation", {
          title: reward?.title,
        })}
        confirmText={t("Common.delete")}
        cancelText={t("Common.cancel")}
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
