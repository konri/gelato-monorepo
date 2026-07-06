import { CheckboxInput } from "@/components/atoms/Checkbox";
import { FormInput } from "@/components/atoms/FormInput";
import { FormSelect } from "@/components/atoms/FormSelect";
import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { LoyaltyEntityFormHeaderBlock } from "@/components/molecules/LoyaltyEntityFormHeaderBlock";
import { LoyaltyEntityFormLoadingScreen } from "@/components/molecules/LoyaltyEntityFormLoadingScreen";
import { PreviewFrame } from "@/components/molecules/PreviewFrame";
import { StreakProgramPreview } from "@/components/molecules/StreakProgramPreview";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { useCreateStreakProgram } from "@/hooks/graphql/mutations/useCreateStreakProgram";
import { useUpdateStreakProgram } from "@/hooks/graphql/mutations/useUpdateStreakProgram";
import { useUpsertStreakProgramStoreOverride } from "@/hooks/graphql/mutations/useUpsertStreakProgramStoreOverride";
import { useGetMerchantPointsProgram } from "@/hooks/graphql/queries/useGetMerchantPointsProgram";
import { useGetMyMerchants } from "@/hooks/graphql/queries/useGetMyMerchants";
import { useGetMyStreakPrograms } from "@/hooks/graphql/queries/useGetMyStreakPrograms";
import { AppFormProvider } from "@/hooks/useFormEditable";
import { useLoyaltyEntityFormRoute } from "@/hooks/useLoyaltyEntityFormRoute";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import { executeStreakFormMutations } from "@/utils/streakFormSubmit";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { StreakStagesSection } from "@/components/molecules/StreakStagesSection";
import {
  DEFAULT_STREAKING_POLICY,
} from "./constants";
import type { StreakProgramFormData } from "./types";
import {
  buildFormDefaultValues,
  buildStageRewardTitlesById,
  getStreakingPolicyOptions,
} from "@/utils/companyStreaksProgramForm";
import { isDuplicateStreakNameError } from "./streakMutationError";

export default function StreakProgramFormScreen() {
  const { t } = useTranslation();
  const { streakProgramId } = useLocalSearchParams<{ streakProgramId?: string }>();
  const {
    selectedMerchantId,
    selectedStoreId,
    canEditGlobalStreaks,
    canEditStreakStoreOverrides,
    canEditGlobalRewards,
  } = useOperatorAccess();
  const {
    isEditMode,
    isStoreOverrideEdit,
    canMutate: canEditStreak,
    resolvedStoreId,
    overrideStoreId,
  } = useLoyaltyEntityFormRoute({
    entityId: streakProgramId,
    selectedStoreId,
    canEditGlobal: canEditGlobalStreaks,
    canEditStoreOverrides: canEditStreakStoreOverrides,
  });

  const { data: streakProgramsData, loading: streakProgramsLoading } = useGetMyStreakPrograms({
    skip: !isEditMode,
    storeId: resolvedStoreId,
  });
  const { data: myMerchantsData } = useGetMyMerchants();

  const program = (streakProgramsData?.myMerchantStreaks ?? []).find(
    (item) => item.id === streakProgramId,
  );
  const merchantId =
    program?.merchantId ??
    selectedMerchantId ??
    myMerchantsData?.myMerchants?.[0]?.id;
  const { data: pointsProgramData } = useGetMerchantPointsProgram({ merchantId });
  const hasActivePointsProgram = Boolean(
    pointsProgramData?.getMerchantPointsProgram?.id &&
      pointsProgramData.getMerchantPointsProgram.isActive,
  );
  const programStages = program?.stages;
  const formDefaultValues = useMemo(
    () => buildFormDefaultValues(program),
    [program],
  );
  const initialRewardTitlesById = useMemo(
    () => buildStageRewardTitlesById(programStages ?? []),
    [programStages],
  );
  const [selectedRewardTitlesById, setSelectedRewardTitlesById] = useState<Record<string, string>>(
    {},
  );
  const resolvedRewardTitlesById = useMemo(
    () => new Map([...initialRewardTitlesById, ...Object.entries(selectedRewardTitlesById)]),
    [initialRewardTitlesById, selectedRewardTitlesById],
  );

  const form = useForm<StreakProgramFormData>({
    defaultValues: formDefaultValues,
    mode: "onChange",
  });

  const handleStreakMutationError = (error: unknown) => {
    if (isDuplicateStreakNameError(error)) {
      form.setError("name", {
        type: "server",
        message: t("Streak.nameAlreadyExists"),
      });
      return;
    }

    Alert.alert(t("Common.error"), t("Common.saveDataFailed"));
  };

  const [createStreakProgram] = useCreateStreakProgram({
    onError: handleStreakMutationError,
  });
  const [updateStreakProgram] = useUpdateStreakProgram({
    onError: handleStreakMutationError,
  });
  const [upsertStreakProgramStoreOverride] = useUpsertStreakProgramStoreOverride({
    onError: handleStreakMutationError,
  });

  const streakingPolicyOptions = useMemo(
    () => getStreakingPolicyOptions(t),
    [t],
  );

  const handleSave = async (data: StreakProgramFormData) => {
    if (!canEditStreak || !merchantId) {
      return;
    }

    await executeStreakFormMutations({
      formValues: data,
      streakProgramId,
      merchantId,
      overrideStoreId,
      selectedStoreId,
      isStoreOverrideEdit,
      isEditMode,
      programRequiredConsecutiveDays: program?.requiredConsecutiveDays,
      shouldUpdateStages: Boolean(form.formState.dirtyFields.stages),
      t,
      createStreakProgram,
      updateStreakProgram,
      upsertStreakProgramStoreOverride,
    });

    router.back();
  };

  const onSubmit = form.handleSubmit(handleSave);


  const [
    watchedStages = [],
    watchedStreakingPolicy = DEFAULT_STREAKING_POLICY,
    watchedStreakingInterval = "1",
  ] = useWatch({
    control: form.control,
    name: ["stages", "streakingPolicy", "streakingInterval"],
  });


  const canSubmit =
    !form.formState.isSubmitting &&
    (isStoreOverrideEdit || watchedStages.length > 0);
  const isDailyStreakPolicy = watchedStreakingPolicy === "DAILY";

  if (isEditMode && streakProgramsLoading) {
    return <LoyaltyEntityFormLoadingScreen />;
  }

  return (
    <KeyboardAwareScrollView className="flex-1" contentContainerClassName="flex-grow-1">
      <AppFormProvider
        form={form}
        editable={canEditStreak}
        defaultValues={formDefaultValues}
        defaultValuesEnabled={Boolean(program)}
      >
          <View className="flex-1 gap-4 p-4">
            <LoyaltyEntityFormHeaderBlock
              title={isEditMode ? t("Streak.editProgram") : t("Streak.createProgram")}
            />

            <PreviewFrame>
              <StreakProgramPreview
                stages={watchedStages}
                rewardTitlesById={resolvedRewardTitlesById}
                streakingPolicy={watchedStreakingPolicy}
                streakingInterval={Number(watchedStreakingInterval) || 1}
              />
            </PreviewFrame>

            <FormInput
              name="name"
              label={t("Streak.name")}
              placeholder={t("Streak.namePlaceholder")}
              required
              variant="compact"
            />

            <FormInput
              name="description"
              label={t("Streak.description")}
              placeholder={t("Streak.descriptionPlaceholder")}
              multiline
              numberOfLines={3}
              variant="compact"
            />

            {isStoreOverrideEdit ? (
              <View className="gap-1">
                <Typography variant="text-12-bold" className="text-gray-600">
                  {t("Streak.streakingPolicy")}
                </Typography>
                <Typography variant="text-16-regular" className="text-gray-900">
                  {streakingPolicyOptions.find((o) => o.value === watchedStreakingPolicy)?.label ??
                    watchedStreakingPolicy}
                </Typography>
              </View>
            ) : (
              <FormSelect
                name="streakingPolicy"
                label={t("Streak.streakingPolicy")}
                placeholder={t("Streak.selectStreakingPolicy")}
                options={streakingPolicyOptions}
                required
                variant="compact"
              />
            )}

            <FormInput
              name="streakingInterval"
              label={t("Streak.streakingInterval")}
              placeholder={t("Streak.streakingIntervalPlaceholder")}
              type="number"
              keyboardType="numeric"
              integerOnly
              min={1}
              required
              variant="compact"
              helperText={t(`Streak.streakingIntervalHelper${watchedStreakingPolicy}`)}
            />

            <FormInput
              name="graceDays"
              label={t(isDailyStreakPolicy ? "Streak.graceDays" : "Streak.gracePeriods")}
              placeholder={t(
                isDailyStreakPolicy
                  ? "Streak.graceDaysPlaceholder"
                  : "Streak.gracePeriodsPlaceholder",
              )}
              type="number"
              keyboardType="numeric"
              integerOnly
              min={0}
              required
              variant="compact"
            />

            {!isStoreOverrideEdit && (
              <StreakStagesSection
                rewardTitlesById={resolvedRewardTitlesById}
                allowPointsBenefits={hasActivePointsProgram}
                onRewardTitleSelect={(rewardId, rewardTitle) => {
                  setSelectedRewardTitlesById((prev) => ({ ...prev, [rewardId]: rewardTitle }));
                }}
                onCreateNewReward={() => {
                  if (!canEditGlobalRewards) {
                    return;
                  }
                  router.push("/company/rewards/form");
                }}
              />
            )}

            <CheckboxInput
              name="repeatable"
              label={t("Streak.repeatableLabel")}
            />
            <CheckboxInput
              name="isActive"
              label={t("Streak.activeLabel")}
            />

            <ActionButtons
              onSubmit={onSubmit}
              onCancel={() => router.back()}
              submitButtonText={isEditMode ? t("Common.save") : t("Common.create")}
              cancelButtonText={t("Common.cancel")}
              isSubmitting={form.formState.isSubmitting}
              canSubmit={canEditStreak && canSubmit}
            />
          </View>
      </AppFormProvider>
    </KeyboardAwareScrollView>
  );
}

