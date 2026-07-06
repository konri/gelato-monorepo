import { EMPTY_STAGE } from "@/app/company/streaks/constants";
import type { StreakProgramFormData } from "@/app/company/streaks/types";
import { CircularIconButton } from "@/components/atoms/CircularIconButton";
import { Typography } from "@/components/atoms/Typography";
import { StreakStageFormCard } from "@/components/molecules/StreakStageFormCard";
import { CouponRewardPickerModal } from "@/components/organisms/CouponRewardPickerModal";
import { useFormEditable } from "@/hooks/useFormEditable";
import React, { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { StreakStagesSectionProps } from "./types";
import { getBenefitTypeOptions } from "./utils";

export const StreakStagesSection = ({
  rewardTitlesById,
  allowPointsBenefits,
  onRewardTitleSelect,
  onCreateNewReward,
}: StreakStagesSectionProps) => {
  const editable = useFormEditable();
  const { t } = useTranslation();
  const form = useFormContext<StreakProgramFormData>();
  const [isRewardPickerOpen, setIsRewardPickerOpen] = useState(false);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const { fields: stageFields, append, remove } = useFieldArray({
    control: form.control,
    name: "stages",
  });
  const watchedStages = useWatch({
    control: form.control,
    name: "stages",
  }) ?? [];
  const selectedModalStage =
    editingStageIndex == null ? undefined : watchedStages[editingStageIndex];

  const openRewardPickerForStage = (index: number) => {
    setEditingStageIndex(index);
    setIsRewardPickerOpen(true);
  };

  const closeRewardPicker = () => {
    setIsRewardPickerOpen(false);
    setEditingStageIndex(null);
  };

  return (
    <>
      <View className="gap-2">
        <Typography variant="text-14-bold" className="text-black">
          {t("Streak.stages")}
        </Typography>
        <View className="gap-4">
          {stageFields.map((stageField, index) => {
            return (
              <StreakStageFormCard
                key={stageField.id}
                index={index}
                stagesCount={stageFields.length}
                stage={watchedStages[index]}
                rewardTitlesById={rewardTitlesById}
                benefitTypeOptions={getBenefitTypeOptions(
                  t,
                  allowPointsBenefits,
                  watchedStages[index]?.benefitType,
                )}
                onRemove={remove}
                onOpenRewardPicker={openRewardPickerForStage}
                onClearReward={(stageIndex) => {
                  form.setValue(`stages.${stageIndex}.rewardId`, "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            );
          })}
        </View>
        {!allowPointsBenefits && (
          <Typography variant="text-12-regular" className="text-gray-600">
            {t("Streak.pointsBenefitsUnavailable")}
          </Typography>
        )}
        <View className="self-end flex-row items-center gap-2">
          <Pressable onPress={() => append({ ...EMPTY_STAGE })} disabled={!editable}>
            <Typography variant="text-14-semibold" className="text-blue-900">
              {t("Streak.addStage")}
            </Typography>
          </Pressable>
          <CircularIconButton
            onPress={() => append({ ...EMPTY_STAGE })}
            size={24}
            backgroundColor="bg-blue-900"
            disabled={!editable}
          />
        </View>
      </View>

      <CouponRewardPickerModal
        visible={isRewardPickerOpen}
        selectedRewardId={selectedModalStage?.rewardId}
        onClose={closeRewardPicker}
        onSave={(rewardId, rewardTitle) => {
          if (editingStageIndex == null) {
            return;
          }
          form.setValue(`stages.${editingStageIndex}.rewardId`, rewardId, {
            shouldDirty: true,
            shouldValidate: true,
          });
          if (rewardTitle) {
            onRewardTitleSelect(rewardId, rewardTitle);
          }
        }}
        onCreateNew={() => {
          if (!editable) {
            return;
          }
          closeRewardPicker();
          onCreateNewReward();
        }}
      />
    </>
  );
};
