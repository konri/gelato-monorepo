import { CheckboxInput } from "@/components/atoms/Checkbox";
import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { PointsCard } from "@/components/molecules/PointsCard";
import { PreviewFrame } from "@/components/molecules/PreviewFrame";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { useSaveMerchantPointsProgram } from "@/hooks/graphql/mutations/useSaveMerchantPointsProgram";
import { useGetMerchantPointsProgram } from "@/hooks/graphql/queries/useGetMerchantPointsProgram";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  buildPointsProgramFormDefaults,
  buildPointsProgramInput,
  type PointsProgramFormData,
} from "./types";

export default function PointsProgramFormScreen() {
  const { t } = useTranslation();
  const { data: myMerchantsData } = useGetMyMerchants();
  const { selectedMerchantId } = useOperatorAccess();
  const { canWrite: canEditPointsProgram } = useFeatureAccess("pointsProgram");
  const merchantId = selectedMerchantId ?? myMerchantsData?.myMerchants?.[0]?.id;
  const pointsProgramQuery = useGetMerchantPointsProgram({ merchantId });
  const [saveMerchantPointsProgram] = useSaveMerchantPointsProgram();

  const pointsProgram =
    pointsProgramQuery.dataState === "complete"
      ? pointsProgramQuery.data?.getMerchantPointsProgram
      : undefined;
  const isEditMode = Boolean(pointsProgram?.id);
  const defaultValues = useMemo(
    () => buildPointsProgramFormDefaults(pointsProgram),
    [pointsProgram],
  );

  const form = useForm<PointsProgramFormData>({
    defaultValues,
    mode: "onChange",
  });

  const [watchedAmountSpent = "", watchedPointsAwarded = "", watchedCardMessage = ""] = useWatch({
    control: form.control,
    name: ["amountSpent", "pointsAwarded", "cardMessage"],
  });

  const previewAmountSpent = Number(watchedAmountSpent);
  const previewPointsAwarded = Number(watchedPointsAwarded);

  const amountSpentForPreview = Number.isFinite(previewAmountSpent) && previewAmountSpent > 0
    ? previewAmountSpent
    : 0;
  const pointsAwardedForPreview =
    Number.isFinite(previewPointsAwarded) && previewPointsAwarded > 0
      ? previewPointsAwarded
      : 0;

  const canSubmit =
    canEditPointsProgram &&
    !form.formState.isSubmitting &&
    amountSpentForPreview > 0 &&
    pointsAwardedForPreview > 0;

  const handleSave = async (data: PointsProgramFormData) => {
    if (!canEditPointsProgram) {
      return;
    }
    if (!merchantId) {
      return;
    }

    await saveMerchantPointsProgram({
      variables: {
        merchantId,
        data: buildPointsProgramInput(data),
      },
    });

    router.back();
  };

  const onSubmit = form.handleSubmit(handleSave);

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50-light"
      contentContainerClassName="p-6 gap-4"
      showsVerticalScrollIndicator={false}
    >
      <AppFormProvider
        form={form}
        editable={canEditPointsProgram}
        defaultValues={defaultValues}
        defaultValuesEnabled={Boolean(pointsProgram)}
      >
          <Typography variant="text-20-bold" className="text-black">
            {isEditMode ? t("PointsProgram.editProgram") : t("PointsProgram.createProgram")}
          </Typography>

          <PreviewFrame>
            <PointsCard
              points={t("PointsProgram.pointsPreview", {
                value: pointsAwardedForPreview.toLocaleString(),
              })}
              description={watchedCardMessage.trim()}
              rateText={t("PointsProgram.ratePreview", {
                amount: amountSpentForPreview.toLocaleString(),
                points: pointsAwardedForPreview.toLocaleString(),
              })}
            />
          </PreviewFrame>

          <View className="gap-3">
            <FormInput
              name="amountSpent"
              label={t("PointsProgram.amountSpent")}
              placeholder={t("PointsProgram.amountSpentPlaceholder")}
              suffix={t("PointsProgram.currencySuffix")}
              type="number"
              keyboardType="numeric"
              min={0.01}
              required
              variant="compact"
            />
            <FormInput
              name="pointsAwarded"
              label={t("PointsProgram.pointsAwarded")}
              placeholder={t("PointsProgram.pointsAwardedPlaceholder")}
              suffix={t("PointsProgram.pointsSuffix")}
              type="number"
              keyboardType="numeric"
              min={0.01}
              required
              variant="compact"
            />
            <FormInput
              name="cardMessage"
              label={t("PointsProgram.cardMessage")}
              placeholder={t("PointsProgram.cardMessagePlaceholder")}
              variant="compact"
              maxLength={120}
            />
            <CheckboxInput
              name="isActive"
              label={t("PointsProgram.activeLabel")}
            />
          </View>

          <ActionButtons
            onSubmit={onSubmit}
            onCancel={() => router.back()}
            submitButtonText={isEditMode ? t("Common.save") : t("Common.create")}
            cancelButtonText={t("Common.cancel")}
            isSubmitting={form.formState.isSubmitting}
            canSubmit={canSubmit}
          />
      </AppFormProvider>
    </KeyboardAwareScrollView>
  );
}
