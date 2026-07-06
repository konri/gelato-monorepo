import { Image } from "@/components/atoms/Image";
import { ImagePickerActions } from "@/components/molecules/ImagePickerActions";
import { usePickAndCrop } from "@/hooks/usePickAndCrop";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";
import type { CircularMerchantLogoPickerProps } from "./types";

export const CircularMerchantLogoPicker = ({
  imageUri,
  onChange,
  onRemove,
  readOnly = false,
  className,
  variant,
  pickAccessibilityLabel: pickA11y,
  removeAccessibilityLabel: removeA11y,
}: CircularMerchantLogoPickerProps) => {
  const { t } = useTranslation();
  const pickLabel = pickA11y ?? t("Merchant.changeLogoPhoto");
  const removeLabel = removeA11y ?? t("Merchant.removeLogoPhoto");

  const { handlePick, cropEditor } = usePickAndCrop({
    cropAspect: 1,
    onChange,
    readOnly,
  });

  const imageBlock = imageUri ? (
    <Image
      key={imageUri}
      source={{ uri: imageUri }}
      className="h-full w-full"
      contentFit="cover"
      fallbackLogoSize={40}
      style={{ width: "100%", height: "100%" }}
    />
  ) : variant === "elevated" ? (
    <Image
      source={null}
      className="h-full w-full"
      contentFit="cover"
      fallbackLogoSize={40}
      style={{ width: "100%", height: "100%" }}
    />
  ) : variant === "profile" ? (
    <View className="h-full w-full items-center justify-center bg-white">
      <Ionicons name="camera-outline" size={32} color="#9E9E9E" />
    </View>
  ) : (
    <View className="h-full w-full bg-gray-200-light" />
  );

  const tapPreviewToReplace = imageUri != null && onChange != null && onRemove != null;

  const preview = tapPreviewToReplace ? (
    <Pressable
      onPress={() => {
        void handlePick();
      }}
      accessibilityLabel={pickLabel}
      className="h-full w-full"
    >
      {imageBlock}
    </Pressable>
  ) : (
    imageBlock
  );

  const ring =
    variant === "elevated" ? (
      <View className="h-full w-full rounded-full bg-white p-2 shadow-md">
        <View className="h-full min-h-0 w-full min-w-0 overflow-hidden rounded-full">
          {preview}
        </View>
      </View>
    ) : variant === "profile" ? (
      <View className="flex h-full min-h-0 w-full min-w-0 overflow-hidden rounded-full border-2 border-gray-200 bg-white">
        {preview}
      </View>
    ) : (
      <View className="flex h-full min-h-0 w-full min-w-0 overflow-hidden rounded-full border border-gray-400 bg-gray-200-light shadow-sm">
        {preview}
      </View>
    );

  return (
    <View className={twMerge("relative", className)}>
      {ring}
      <ImagePickerActions
        value={imageUri}
        onPick={() => {
          void handlePick();
        }}
        onRemove={onRemove}
        readOnly={readOnly}
        showPickFloat
        floatClassName="absolute -right-0.5 top-2 z-10"
        pickAccessibilityLabel={pickLabel}
        removeAccessibilityLabel={removeLabel}
      />
      {cropEditor}
    </View>
  );
};
