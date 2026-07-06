import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type NavigationButtonsProps = {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  nextButtonText?: string;
};

export const NavigationButtons = ({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  nextButtonText,
}: NavigationButtonsProps) => {
  const { t } = useTranslation();

  return (
    <View className="flex-row justify-between items-center w-full gap-2.5 py-1">
      {canGoBack ? (
        <Pressable onPress={onBack}>
          <Typography
            variant="text-14-semibold"
            className="text-gray-550"
          >
            {t("Common.back")}
          </Typography>
        </Pressable>
      ) : (
        <View />
      )}

      <Pressable onPress={onNext} disabled={!canGoNext}>
        <Typography
          variant="text-14-semibold"
          className={`${
            canGoNext ? "text-blue-900" : "text-gray-550"
          }`}
        >
          {nextButtonText || t("Common.next")}
        </Typography>
      </Pressable>
    </View>
  );
};
