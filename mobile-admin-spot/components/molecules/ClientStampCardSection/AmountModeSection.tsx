import { Button } from "@/components/atoms/Button";
import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { computeStampsFromSpentAmount } from "@/utils/stampTemplateAward";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type AmountModeSectionProps = {
  amountPerStamp: number;
  onAddStamp: (count: number) => Promise<boolean>;
  isAddingStamp: boolean;
  spentAmountPlaceholder?: string;
  onSpentAmountFocus?: () => void;
  onSpentAmountBlur?: () => void;
};

type AmountFormValues = {
  spentAmount: string;
};

const ARROW_ICON_COLOR = "#585858";

export const AmountModeSection = ({
  amountPerStamp,
  onAddStamp,
  isAddingStamp,
  spentAmountPlaceholder,
  onSpentAmountFocus,
  onSpentAmountBlur,
}: AmountModeSectionProps) => {
  const { t } = useTranslation();

  const form = useForm<AmountFormValues>({
    defaultValues: { spentAmount: "" },
  });
  const rawSpentAmount =
    useWatch({
      control: form.control,
      name: "spentAmount",
    }) ?? "";

  const stampsFromAmount = useMemo(
    () => computeStampsFromSpentAmount(rawSpentAmount, amountPerStamp),
    [rawSpentAmount, amountPerStamp],
  );

  const placeholder = spentAmountPlaceholder ?? t("Rewards.spentAmountPlaceholder");
  const canSubmit = !isAddingStamp && stampsFromAmount > 0;

  const handleSubmit = async () => {
    const isSuccess = await onAddStamp(stampsFromAmount);
    if (isSuccess) {
      form.setValue("spentAmount", "");
    }
  };

  return (
    <>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 rounded-xl border border-blue-900 p-2 gap-2">
          <Typography variant="text-12-bold" className="text-black text-center">
            {t("Rewards.stampAssignByAmountTitle")}
          </Typography>
          <FormProvider {...form}>
            <FormInput
              name="spentAmount"
              label=""
              placeholder={placeholder}
              type="number"
              keyboardType="numeric"
              variant="compact"
              suffix={t("Rewards.currencyShort")}
              onFocus={onSpentAmountFocus}
              onBlur={onSpentAmountBlur}
            />
          </FormProvider>
        </View>

        <View className="px-3">
          <Ionicons name="arrow-forward" size={20} color={ARROW_ICON_COLOR} />
        </View>

        <View className="flex-1 rounded-xl border border-accent p-2 gap-2">
          <Typography variant="text-12-bold" className="text-black text-center">
            {t("Rewards.stampAssignByAmountPreview")}
          </Typography>
          <View className="rounded-2xl border border-blue-400-30 px-3 py-2.5 flex-row items-center justify-center">
            <Typography variant="text-32-semibold-38" className="text-accent">
              {stampsFromAmount}
            </Typography>
          </View>
        </View>
      </View>

      <Button
        title={t("Rewards.addStampsCta", { count: stampsFromAmount })}
        onPress={handleSubmit}
        variant="primary"
        width="100%"
        size="sm"
        disabled={!canSubmit}
      />
    </>
  );
};
