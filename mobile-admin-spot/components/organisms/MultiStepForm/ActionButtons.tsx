import { Typography } from "@/components/atoms/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type ActionButtonsProps = {
  onSubmit: () => void;
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  isSubmitting?: boolean;
  canSubmit?: boolean;
};

export const ActionButtons = ({
  onSubmit,
  onCancel,
  submitButtonText,
  cancelButtonText,
  isSubmitting = false,
  canSubmit = false,
}: ActionButtonsProps) => {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2.5">
      {onCancel && (
        <Pressable
          onPress={onCancel}
          disabled={isSubmitting}
          className="flex-1 items-center justify-center rounded-full h-8 bg-gray-400"
        >
          <Typography
            variant="text-14-semibold"
            className="text-white leading-22.4 text-sm font-bold"
          >
            {cancelButtonText || t("Common.cancel")}
          </Typography>
        </Pressable>
      )}

      <Pressable
        onPress={onSubmit}
        disabled={isSubmitting || !canSubmit}
        className={`flex-1 items-center justify-center rounded-full h-8 bg-blue-900 ${
          canSubmit ? "opacity-100" : "opacity-25"
        }`}
      >
        <Typography
          variant="text-14-semibold"
          className="text-white leading-22.4 text-sm font-bold"
        >
          {isSubmitting
            ? t("Common.loading")
            : submitButtonText || t("Common.submit")}
        </Typography>
      </Pressable>
    </View>
  );
};
