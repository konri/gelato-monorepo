import { CouponRewardPickerModal } from "@/components/organisms/CouponRewardPickerModal";
import { useCreateCoupon } from "@/hooks/graphql/mutations/useCreateCoupon";
import { useUpdateCoupon } from "@/hooks/graphql/mutations/useUpdateCoupon";
import { useUpsertCouponStoreOverride } from "@/hooks/graphql/mutations/useUpsertCouponStoreOverride";
import { useGetMyMerchantCoupons } from "@/hooks/graphql/queries/useGetMyMerchantCoupons";
import { useGetMyRewards } from "@/hooks/graphql/queries/useGetMyRewards";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { useFormImageOverride } from "@/hooks/useFormImageOverride";
import { useLoyaltyEntityFormRoute } from "@/hooks/useLoyaltyEntityFormRoute";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { Coupon } from "@/shared/api-client/src/graphql/mutations/coupon";
import type { CouponFormData } from "@/utils/couponForm";
import { executeCouponFormMutations } from "@/utils/couponFormSubmit";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";
import { getCouponMutationErrorMessage } from "./couponMutationError";

type CouponWizardFormContextType = {
  form: UseFormReturn<CouponFormData>;
  selectedRewardTitle?: string;
  isEditMode: boolean;
  isClaimLocked: boolean;
  isStoreOverrideEdit: boolean;
  canEditCoupons: boolean;
  isSaving: boolean;
  openRewardPicker: () => void;
  clearRewardSelection: () => void;
  couponImageDisplayUri: string | null;
  onCouponImagePick: (uri: string) => void;
  onCouponImageRemovePress: (() => void) | undefined;
  submitCoupon: () => Promise<void>;
};

const CouponWizardFormContext = createContext<CouponWizardFormContextType | null>(null);

export const useCouponWizardForm = (): CouponWizardFormContextType => {
  const context = useContext(CouponWizardFormContext);
  if (!context) {
    throw new Error("useCouponWizardForm must be used within CouponWizardFormProvider");
  }
  return context;
};

export default function CouponFormLayout() {
  const { t } = useTranslation();
  const {
    canEditGlobalCoupons,
    canEditCouponStoreOverrides,
    canEditGlobalRewards,
    selectedStoreId,
  } = useOperatorAccess();
  const { couponId } = useLocalSearchParams<{ couponId?: string }>();
  const {
    isEditMode,
    isStoreOverrideEdit,
    canMutate: couponWizardCanMutate,
    resolvedStoreId,
    overrideStoreId,
    scopeCreateStoreId,
  } = useLoyaltyEntityFormRoute({
    entityId: couponId,
    selectedStoreId,
    canEditGlobal: canEditGlobalCoupons,
    canEditStoreOverrides: canEditCouponStoreOverrides,
  });
  const form = useForm<CouponFormData>({
    defaultValues: {
      code: "",
      title: "",
      shortDescription: "",
      description: "",
      termsAndCondition: "",
      couponType: "DISCOUNT",
      availability: "FREE",
      displayType: "STANDARD",
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      discountType: "PERCENTAGE",
      isStackable: false,
      assignToUserEmail: "",
      exclusivityGroups: [],
      isActive: true,
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });
  const [isRewardPickerOpen, setIsRewardPickerOpen] = useState(false);
  const { rewards } = useGetMyRewards({
    storeId: resolvedStoreId,
  });
  const { merchantCoupons, loading: couponsLoading } = useGetMyMerchantCoupons({
    skip: !isEditMode,
    storeId: resolvedStoreId,
  });
  const editingCoupon = merchantCoupons.find((coupon) => coupon.id === couponId);
  const isClaimLocked = isEditMode && (editingCoupon?.currentUses ?? 0) > 0;
  const [createCoupon, { loading: isCreating }] = useCreateCoupon();
  const [updateCoupon, { loading: isUpdating }] = useUpdateCoupon();
  const [upsertCouponStoreOverride, { loading: isUpsertingOverride }] = useUpsertCouponStoreOverride();
  const isSaving = isCreating || isUpdating || isUpsertingOverride;
  const rewardId = useWatch({
    control: form.control,
    name: "rewardId",
  });
  const selectedReward = rewards.find((reward) => reward.id === rewardId);

  const {
    displayUri: couponImageDisplayUri,
    onPick: onCouponImagePickInternal,
    onRemovePress: couponImageRemovePressInternal,
    resolveUrlForSubmit: resolveCouponImageUrlForSubmit,
  } = useFormImageOverride({
    form,
    fieldName: "imageUrl",
    resetKey: couponId ?? "new",
  });

  const toOptionalString = useCallback((value?: number) => {
    if (value == null) {
      return undefined;
    }
    return value.toString();
  }, []);

  const mapCouponToFormData = useCallback(
    (coupon: Coupon): CouponFormData => ({
      code: coupon.code ?? "",
      title: coupon.title,
      shortDescription: coupon.shortDescription ?? "",
      description: coupon.description ?? "",
      termsAndCondition: coupon.termsAndConditions ?? "",
      couponType: coupon.couponType,
      availability: coupon.availability ?? "FREE",
      displayType: coupon.displayType,
      pointsCost: toOptionalString(coupon.pointsCost),
      rewardId: coupon.rewardId,
      validFrom: coupon.validFrom ?? new Date().toISOString(),
      validUntil: coupon.validUntil,
      imageUrl: coupon.imageUrl,
      usesPerUserLimit: toOptionalString(coupon.usesPerUserLimit),
      globalUsageLimit: toOptionalString(coupon.globalUsageLimit),
      assignToUserId: coupon.assignToUserId,
      assignToUserEmail: "",
      exclusivityGroups: coupon.exclusivityGroups ?? [],
      buyQuantity: toOptionalString(coupon.buyQuantity),
      getQuantity: toOptionalString(coupon.getQuantity),
      discountType: coupon.discountType,
      discountValue: toOptionalString(coupon.discountValue),
      dayOfWeek: coupon.dayOfWeek,
      thresholdAmount: toOptionalString(coupon.thresholdAmount),
      discountAmount: toOptionalString(coupon.discountAmount),
      itemName: coupon.itemName,
      itemBarcode: coupon.itemBarcode,
      daysBeforeBirthday: toOptionalString(coupon.daysBeforeBirthday),
      daysAfterBirthday: toOptionalString(coupon.daysAfterBirthday),
      activityType: coupon.activityType,
      isStackable: coupon.isStackable ?? false,
      isActive: coupon.isActive,
    }),
    [toOptionalString],
  );

  useEffect(() => {
    if (!isEditMode || !editingCoupon) {
      return;
    }
    form.reset(mapCouponToFormData(editingCoupon));
  }, [editingCoupon, form, isEditMode, mapCouponToFormData]);

  const openRewardPicker = useCallback(() => {
    if (isClaimLocked || !couponWizardCanMutate) {
      return;
    }
    setIsRewardPickerOpen(true);
  }, [couponWizardCanMutate, isClaimLocked]);

  const clearRewardSelection = useCallback(() => {
    if (isClaimLocked || !couponWizardCanMutate) {
      return;
    }
    form.setValue("rewardId", undefined, { shouldDirty: true });
  }, [couponWizardCanMutate, form, isClaimLocked]);

  const submitCoupon = useCallback(async () => {
    if (!couponWizardCanMutate) {
      return;
    }
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }
    try {
      const rawValues = form.getValues();
      const resolvedImageUrl = await resolveCouponImageUrlForSubmit(rawValues.imageUrl);
      await executeCouponFormMutations({
        formValues: { ...rawValues, imageUrl: resolvedImageUrl },
        couponId,
        overrideStoreId,
        isStoreOverrideEdit,
        isEditMode,
        scopeCreateStoreId,
        createCoupon,
        updateCoupon,
        upsertCouponStoreOverride,
      });
      router.replace("/company/coupons");
    } catch (error) {
      Alert.alert(t("Common.error"), getCouponMutationErrorMessage(error, t, isEditMode));
    }
  }, [
    couponId,
    couponWizardCanMutate,
    createCoupon,
    form,
    isEditMode,
    isStoreOverrideEdit,
    overrideStoreId,
    scopeCreateStoreId,
    t,
    updateCoupon,
    upsertCouponStoreOverride,
    resolveCouponImageUrlForSubmit,
  ]);

  const contextValue = useMemo(
    () => ({
      form,
      selectedRewardTitle: selectedReward?.title,
      isEditMode,
      isClaimLocked,
      isStoreOverrideEdit,
      canEditCoupons: couponWizardCanMutate,
      isSaving,
      openRewardPicker,
      clearRewardSelection,
      couponImageDisplayUri,
      onCouponImagePick: onCouponImagePickInternal,
      onCouponImageRemovePress: couponImageRemovePressInternal,
      submitCoupon,
    }),
    [
      clearRewardSelection,
      couponImageDisplayUri,
      couponWizardCanMutate,
      form,
      isClaimLocked,
      isEditMode,
      isSaving,
      isStoreOverrideEdit,
      onCouponImagePickInternal,
      couponImageRemovePressInternal,
      openRewardPicker,
      selectedReward?.title,
      submitCoupon,
    ],
  );

  if (isEditMode && couponsLoading && !editingCoupon) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4196" />
      </View>
    );
  }

  return (
    <CouponWizardFormContext.Provider value={contextValue}>
      <AppFormProvider form={form} editable={couponWizardCanMutate}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <CouponRewardPickerModal
          visible={isRewardPickerOpen}
          selectedRewardId={rewardId}
          onClose={() => setIsRewardPickerOpen(false)}
          onSave={(selectedId) => form.setValue("rewardId", selectedId, { shouldDirty: true })}
          onCreateNew={() => {
            if (!canEditGlobalRewards) {
              return;
            }
            setIsRewardPickerOpen(false);
            router.push("/company/rewards/form");
          }}
        />
      </AppFormProvider>
    </CouponWizardFormContext.Provider>
  );
}
