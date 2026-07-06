import type { StreakProgramFormData } from "@/app/company/streaks/types";
import { FormInput } from "@/components/atoms/FormInput";
import { FormSelect } from "@/components/atoms/FormSelect";
import { Typography } from "@/components/atoms/Typography";
import { DeleteButton } from "@/components/molecules/DeleteButton";
import { CouponRewardPickerField } from "@/components/organisms/CouponRewardPickerField";
import { useFormEditable } from "@/hooks/useFormEditable";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { StreakStageFormCardProps } from "./types";
import { validateDayThreshold, validateRequiredReward } from "./utils";

export const StreakStageFormCard = ({
  index,
  stagesCount,
  stage,
  rewardTitlesById,
  benefitTypeOptions,
  onRemove,
  onOpenRewardPicker,
  onClearReward,
}: StreakStageFormCardProps) => {
  const editable = useFormEditable();
  const { t } = useTranslation();
  const form = useFormContext<StreakProgramFormData>();
  const selectedBenefitType = stage?.benefitType ?? "INFO_ONLY";
  const selectedRewardId = stage?.rewardId ?? "";
  const selectedRewardTitle =
    (selectedRewardId ? rewardTitlesById.get(selectedRewardId) : undefined) ??
    t("Streak.noReward");

  const dayThresholdFieldName = `stages.${index}.dayThreshold` as const;
  const benefitTypeFieldName = `stages.${index}.benefitType` as const;
  const rewardFieldName = `stages.${index}.rewardId` as const;
  const pointsMultiplierFieldName = `stages.${index}.pointsMultiplier` as const;
  const pointsAmountFieldName = `stages.${index}.pointsAmount` as const;

  useEffect(() => {
    if (selectedBenefitType === "REWARD") {
      void form.trigger(rewardFieldName);
      return;
    }

    form.clearErrors(rewardFieldName);
  }, [form, rewardFieldName, selectedBenefitType]);

  return (
    <View className="relative rounded-2xl border border-gray-200 p-4 gap-3">
      <View pointerEvents="none" className="absolute inset-x-0 -top-3 items-center">
        <View className="h-6 w-6 rounded-full bg-blue-900 items-center justify-center">
          <Typography variant="text-12-semibold" className="text-white">
            {index + 1}
          </Typography>
        </View>
      </View>
      {stagesCount > 1 ? (
        <View className="absolute right-2 top-2 z-10">
          <DeleteButton onPress={() => onRemove(index)} disabled={!editable} />
        </View>
      ) : null}

      <FormInput
        name={dayThresholdFieldName}
        label={t("Streak.requiredConsecutiveDays")}
        placeholder={t("Streak.requiredConsecutiveDaysPlaceholder")}
        type="number"
        keyboardType="numeric"
        integerOnly
        min={1}
        required
        variant="compact"
        customValidation={{
          validate: (value) =>
            validateDayThreshold({
              value,
              stages: form.getValues("stages"),
              stageIndex: index,
              invalidDataMessage: t("Validation.invalidData"),
              duplicateMessage: t("Streak.uniqueDayThreshold"),
              lowerThanPreviousMessage: t("Streak.dayThresholdLowerThanPrevious"),
            }),
          message: t("Validation.invalidData"),
        }}
      />

      <FormSelect
        name={benefitTypeFieldName}
        label={t("Streak.stageBenefitType")}
        placeholder={t("Streak.stageBenefitTypePlaceholder")}
        options={benefitTypeOptions}
        required
        variant="compact"
      />

      {selectedBenefitType !== "INFO_ONLY" ? (
        <View className="gap-2">
          <Typography variant="text-14-regular-spaced" className="text-black">
            {t("Streak.stageBenefitValue")}
          </Typography>

          {selectedBenefitType === "REWARD" ? (
            <CouponRewardPickerField
              name={rewardFieldName}
              selectedRewardTitle={selectedRewardId ? selectedRewardTitle : undefined}
              placeholderText={t("Streak.selectReward")}
              clearSelectionText={t("Streak.clearReward")}
              customValidation={{
                validate: (value) =>
                  validateRequiredReward(
                    value,
                    selectedBenefitType,
                    t("Validation.fieldRequired"),
                  ),
                message: t("Validation.fieldRequired"),
              }}
              onOpenPicker={() => onOpenRewardPicker(index)}
              onClearSelection={() => onClearReward(index)}
              label=""
              helperText=""
              disabled={!editable}
            />
          ) : null}

          {selectedBenefitType === "POINTS_MULTIPLIER" ? (
            <FormInput
              name={pointsMultiplierFieldName}
              label={t("Streak.pointsMultiplier")}
              placeholder={t("Streak.pointsMultiplierPlaceholder")}
              type="number"
              keyboardType="numeric"
              min={0.01}
              required
              variant="compact"
            />
          ) : null}

          {selectedBenefitType === "FIXED_POINTS" ? (
            <FormInput
              name={pointsAmountFieldName}
              label={t("Streak.pointsAmount")}
              placeholder={t("Streak.pointsAmountPlaceholder")}
              type="number"
              keyboardType="numeric"
              integerOnly
              min={1}
              required
              variant="compact"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
