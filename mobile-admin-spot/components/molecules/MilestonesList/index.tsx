import { Checkbox } from "@/components/atoms/Checkbox";
import { Typography } from "@/components/atoms/Typography";
import { InfoBanner } from "@/components/molecules/InfoBanner";
import { IntermediateRewardScenarioBox } from "@/components/molecules/IntermediateRewardScenarioBox";
import { MilestonesForm } from "@/components/molecules/MilestonesForm";
import { ActionButtons } from "@/components/organisms/MultiStepForm/ActionButtons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { MilestonesListProps } from "./types";

export const MilestonesList = ({
  maxStamps,
  onCancel,
  onDone,
}: MilestonesListProps) => {
  const { t } = useTranslation();
  const { mode, templateId, lockCriticalFields } = useLocalSearchParams<{
    mode?: string;
    templateId?: string;
    lockCriticalFields?: string;
  }>();
  const isCriticalFieldsLocked = lockCriticalFields === "true";
  const form = useFormContext();
  const [enableIntermediateReward, setEnableIntermediateReward] =
    useState(false);

  const removesStamps = form.watch("intermediateRewardRemovesStamps") ?? true;
  const existingMilestones = form.watch("milestones");

  useEffect(() => {
    if (existingMilestones?.length) {
      setEnableIntermediateReward(true);
    }
  }, [existingMilestones]);

  const toggleRemovesStamps = () => {
    if (isCriticalFieldsLocked) return;
    form.setValue("intermediateRewardRemovesStamps", !removesStamps);
  };

  const toggleEnableIntermediateReward = () => {
    if (isCriticalFieldsLocked) return;
    const newValue = !enableIntermediateReward;
    setEnableIntermediateReward(newValue);

    if (newValue) {
      const existing = form.getValues("milestones");
      if (!existing?.length) {
        form.setValue("milestones", [{ stampsRequired: 1 }], {
          shouldDirty: true,
        });
      }
    } else {
      form.setValue("milestones", undefined, { shouldDirty: false });
      form.setValue("intermediateRewardRemovesStamps", undefined, {
        shouldDirty: false,
      });
      form.setValue("intermediateRewardMessage", undefined, {
        shouldDirty: false,
      });
    }
  };

  const handleDone = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      if (enableIntermediateReward) {
        if (mode === "edit" && templateId) {
          router.push({
            pathname: "/company/stamp-card-template/rewardPicker",
            params: {
              forMilestone: "true",
              mode,
              templateId,
              lockCriticalFields,
            },
          });
          return;
        }
        router.push("/company/stamp-card-template/rewardPicker?forMilestone=true");
      } else {
        if (mode === "edit" && templateId) {
          router.push({
            pathname: "/company/stamp-card-template/stampSummary",
            params: { mode, templateId, lockCriticalFields },
          });
          return;
        }
        router.push("/company/stamp-card-template/stampSummary");
      }
    }
  };

  return (
    <View className="gap-4">
      {isCriticalFieldsLocked && (
        <InfoBanner text={t("Loyalty.templateEditLockedInfo")} />
      )}
      <View className="gap-1">
        <Typography variant="text-14-bold-spaced" className="text-black">
          {t("Loyalty.intermediateRewardTitle")}
        </Typography>
        <Typography variant="text-12-regular" className="text-black">
          {t("Loyalty.intermediateRewardDescription")}
        </Typography>
        <Typography variant="text-12-bold" className="text-black">
          {t("Loyalty.intermediateRewardHighlight")}
        </Typography>
      </View>

      <Checkbox
        checked={enableIntermediateReward}
        label={t("Loyalty.intermediateRewardTitle")}
        onToggle={toggleEnableIntermediateReward}
        disabled={isCriticalFieldsLocked}
      />

      {enableIntermediateReward && (
        <View className="gap-4">
          <Checkbox
            checked={removesStamps}
            label={t("Loyalty.intermediateRewardRemovesStampsLabel")}
            onToggle={toggleRemovesStamps}
            disabled={isCriticalFieldsLocked}
          />
          {removesStamps ? (
            <IntermediateRewardScenarioBox
              id="intermediateRewardScenarioRemoves"
              title={t("Loyalty.intermediateRewardScenarioRemovesTitle")}
              boldTitle={t("Loyalty.intermediateRewardRemovesStepsTitleBold")}
              leftSteps={[
                t("Loyalty.intermediateRewardRemovesStep1"),
                t("Loyalty.intermediateRewardRemovesStep2"),
                t("Loyalty.intermediateRewardRemovesStep3"),
                t("Loyalty.intermediateRewardRemovesStep4"),
              ]}
              rightTitle={t(
                "Loyalty.intermediateRewardRemovesBalanceTitleRight",
              )}
              rightItems={[
                t("Loyalty.intermediateRewardRemovesBalance1"),
                t("Loyalty.intermediateRewardRemovesBalance2"),
                t("Loyalty.intermediateRewardRemovesBalance3"),
                t("Loyalty.intermediateRewardRemovesBalance4"),
              ]}
            />
          ) : (
            <IntermediateRewardScenarioBox
              id="intermediateRewardScenarioKeeps"
              title={t("Loyalty.intermediateRewardScenarioKeepsTitle")}
              boldTitle={t("Loyalty.intermediateRewardKeepsStepsTitleBold")}
              leftSteps={[
                t("Loyalty.intermediateRewardKeepsStep1"),
                t("Loyalty.intermediateRewardKeepsStep2"),
                t("Loyalty.intermediateRewardKeepsStep3"),
                t("Loyalty.intermediateRewardKeepsStep4"),
              ]}
              rightTitle={t("Loyalty.intermediateRewardKeepsBalanceTitleRight")}
              rightItems={[
                t("Loyalty.intermediateRewardKeepsBalance1"),
                t("Loyalty.intermediateRewardKeepsBalance2"),
                t("Loyalty.intermediateRewardKeepsBalance3"),
                t("Loyalty.intermediateRewardKeepsBalance4"),
              ]}
            />
          )}
        </View>
      )}

      {enableIntermediateReward && (
        <View
          className={isCriticalFieldsLocked ? "opacity-50" : undefined}
          pointerEvents={isCriticalFieldsLocked ? "none" : "auto"}
        >
          <MilestonesForm maxStamps={maxStamps} />
        </View>
      )}

      {(onCancel || onDone) && (
        <ActionButtons
          onSubmit={handleDone}
          onCancel={onCancel}
          submitButtonText={
            enableIntermediateReward
              ? t("Loyalty.next")
              : t("Loyalty.omitReward")
          }
          cancelButtonText={t("Common.back")}
          canSubmit
        />
      )}
    </View>
  );
};
