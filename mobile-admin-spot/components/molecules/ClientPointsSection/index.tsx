import { Button } from "@/components/atoms/Button";
import { FormInput } from "@/components/atoms/FormInput";
import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { ClientPointsSectionProps } from "./types";

const formatPointsValue = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString()
    : rounded.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
};
const roundPoints = (value: number): number => Math.round(value * 100) / 100;

export const ClientPointsSection = ({
  model,
  onSpentAmountFocus,
  onSpentAmountBlur,
  onAssignPoints,
}: ClientPointsSectionProps) => {
  const { t } = useTranslation();
  const {
    currentPoints,
    spentAmountPlaceholder,
    amountSpent,
    pointsAwarded,
    multiply,
    fixedPoints,
    isAssigning,
    canAssignBase,
  } = model;
  const form = useForm<{ spentAmount: string }>({
    defaultValues: { spentAmount: "" },
    mode: "onChange",
  });
  const watchedSpentAmount =
    useWatch({
      control: form.control,
      name: "spentAmount",
    }) ?? "";

  const parsedSpentAmountValue = Number(watchedSpentAmount);
  const spentAmountValue = Number.isFinite(parsedSpentAmountValue) ? parsedSpentAmountValue : 0;

  const { standardPoints, totalAwardedPoints, streakBonusPoints } = useMemo(() => {
    if (spentAmountValue <= 0 || amountSpent <= 0) {
      return {
        standardPoints: 0,
        totalAwardedPoints: 0,
        streakBonusPoints: 0,
      };
    }
    const standardPointsRaw = (spentAmountValue / amountSpent) * pointsAwarded;
    const totalAwardedPointsRaw = Math.max(0, standardPointsRaw * multiply + fixedPoints);
    return {
      standardPoints: roundPoints(standardPointsRaw),
      totalAwardedPoints: roundPoints(totalAwardedPointsRaw),
      streakBonusPoints: roundPoints(Math.max(0, totalAwardedPointsRaw - standardPointsRaw)),
    };
  }, [amountSpent, fixedPoints, multiply, pointsAwarded, spentAmountValue]);

  const hasStreakBonus = streakBonusPoints > 0;
  const displayedReceivedPoints = hasStreakBonus ? totalAwardedPoints : standardPoints;
  const isMultiplierBonus = multiply > 1;
  const canAssign = canAssignBase && spentAmountValue > 0;
  const bonusDisplayValue = isMultiplierBonus
    ? `x${formatPointsValue(multiply)}`
    : `${formatPointsValue(fixedPoints)} ${t("Rewards.pointsShort")}`;
  const totalPreviewFormula = isMultiplierBonus
    ? `${formatPointsValue(standardPoints)} ${t("Rewards.pointsShort")} * ${formatPointsValue(multiply)} = ${formatPointsValue(totalAwardedPoints)} ${t("Rewards.pointsShort")}`
    : `${formatPointsValue(standardPoints)} ${t("Rewards.pointsShort")} + ${formatPointsValue(streakBonusPoints)} ${t("Rewards.pointsShort")} = ${formatPointsValue(totalAwardedPoints)} ${t("Rewards.pointsShort")}`;

  return (
    <View className="bg-white rounded-2xl p-4 gap-3">
      <View className="flex-row items-start justify-between">
        <Typography variant="text-18-bold-tight" className="text-black">
          {t("Rewards.clientPoints")}
        </Typography>
        <Typography variant="text-32-semibold-38" className="text-accent">
          {formatPointsValue(currentPoints)} {t("Rewards.pointsShort")}
        </Typography>
      </View>

      <View className="py-2 items-center">
        <View className="w-40 border-t-2 border-blue-400-30" />
      </View>

      <Typography variant="text-18-bold-tight" className="text-black text-center">
        {t("Rewards.assignPointsTitle")}
      </Typography>

      <View className="flex-row items-center justify-between">
        <View className="flex-1 rounded-xl border border-blue-900 p-2 gap-2">
          <Typography variant="text-12-bold" className="text-black text-center">
            {t("Rewards.spentAmount")}
          </Typography>
          <FormProvider {...form}>
            <FormInput
              name="spentAmount"
              label=""
              placeholder={spentAmountPlaceholder ?? t("Rewards.spentAmountPlaceholder")}
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
          <Ionicons name="arrow-forward" size={20} color="#585858" />
        </View>

        <View className="flex-1 rounded-xl border border-accent p-2 gap-2">
          <Typography variant="text-12-bold" className="text-black text-center">
            {t("Rewards.receivedPoints")}
          </Typography>
          <View className="rounded-2xl border border-blue-400-30 px-3 py-2.5 flex-row items-center justify-end gap-2">
            <Typography variant="text-14-regular-spaced" className="text-black">
              {formatPointsValue(displayedReceivedPoints)}
            </Typography>
            <Typography variant="text-14-regular-spaced" className="text-black">
              {t("Rewards.pointsShort")}
            </Typography>
          </View>
        </View>
      </View>

      {hasStreakBonus && (
        <View className="rounded-xl border border-accent bg-red-600-9 p-3 gap-1">
          <Typography variant="text-12-bold" className="text-accent">
            {t("Rewards.basePointsLabel")}: {formatPointsValue(standardPoints)}{" "}
            {t("Rewards.pointsShort")}
          </Typography>
          <Typography variant="text-12-bold" className="text-accent">
            {t("Rewards.streakBonusLabel")}: {bonusDisplayValue}
          </Typography>
          <Typography variant="text-12-bold" className="text-accent">
            {t("Rewards.totalPointsLabel")}: {totalPreviewFormula}
          </Typography>
        </View>
      )}

      <Button
        title={t("Rewards.addPointsCta", {
          count: totalAwardedPoints,
        })}
        onPress={async () => {
          const isSuccess = await onAssignPoints(watchedSpentAmount);
          if (isSuccess) {
            form.setValue("spentAmount", "");
          }
        }}
        variant="primary"
        width="100%"
        size="sm"
        disabled={!canAssign || isAssigning}
      />
    </View>
  );
};
