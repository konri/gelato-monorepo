import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { RewardForm } from "@/components/organisms/RewardForm";
import { useOperatorAccess } from "@/hooks/useOperatorAccess";
import type { RewardFormData } from "@/utils/rewardForm";
import { applyRewardToStampCardForm } from "@/utils/rewardMapping";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { View } from "react-native";
import { useStampCardForm } from "./_layout";

export default function RewardScreen() {
  const { selectedMerchantId, merchants } = useOperatorAccess();
  const logoUrl = useMemo(() => {
    const m = selectedMerchantId
      ? merchants.find((x) => x.id === selectedMerchantId)
      : merchants[0];
    return m?.logoUrl?.trim() ? m.logoUrl : undefined;
  }, [merchants, selectedMerchantId]);

  const { next, mode, templateId, lockCriticalFields } = useLocalSearchParams<{
    next?: string;
    mode?: string;
    templateId?: string;
    lockCriticalFields?: string;
  }>();
  const imageOverrideResetKey = templateId ?? "new-stamp-template-reward";
  const form = useStampCardForm();
  const isForMilestone = next === "stampSummary";
  const nextPath = isForMilestone
    ? "/company/stamp-card-template/stampSummary"
    : "/company/stamp-card-template/milestone";
  const editParams =
    mode === "edit" && templateId
      ? { mode, templateId, lockCriticalFields: lockCriticalFields ?? "false" }
      : undefined;

  const handleSave = (data: RewardFormData) => {
    applyRewardToStampCardForm(form, data, isForMilestone);
    if (editParams) {
      router.push({
        pathname: nextPath,
        params: editParams,
      });
      return;
    }
    router.push(nextPath);
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50-light"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-4 px-6 py-4">
        <RewardForm
          logoUrl={logoUrl}
          onSave={handleSave}
          imageOverrideResetKey={imageOverrideResetKey}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}
