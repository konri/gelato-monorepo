import AddPhotoIcon from "@/assets/images/add_photo_icon.svg";
import { Image } from "@/components/atoms/Image";
import { Typography } from "@/components/atoms/Typography";
import { ImagePickerActions } from "@/components/molecules/ImagePickerActions";
import { usePickAndCrop } from "@/hooks/usePickAndCrop";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export type ImagePickerValue = string | null;

export type ImagePickerPreviewShape = "circle" | "rectangle";

type ImagePickerProps = {
  value: ImagePickerValue;
  onChange: (uri: string) => void;
  labelTranslationKey?: string;
  readOnly?: boolean;
  onRemove?: () => void;
  removeAccessibilityLabel?: string;
  previewShape?: ImagePickerPreviewShape;
  cropAspect?: [number, number];
};

export const ImagePicker = ({
  value,
  onChange,
  labelTranslationKey = "Loyalty.clickToAddPhoto",
  readOnly = false,
  onRemove,
  removeAccessibilityLabel,
  previewShape = "circle",
  cropAspect,
}: ImagePickerProps) => {
  const { t } = useTranslation();
  const resolvedAspect = cropAspect ?? [1, 1];
  const { handlePick, cropEditor } = usePickAndCrop({
    cropAspect: resolvedAspect[0] / resolvedAspect[1],
    onChange,
    readOnly,
  });

  return (
    <View className="relative h-full w-full">
      <Pressable
        onPress={() => {
          void handlePick();
        }}
        disabled={readOnly}
        className="h-full w-full items-center justify-center"
      >
        {value ? (
          <View
            className={
              previewShape === "rectangle"
                ? "h-full w-full overflow-hidden"
                : "h-full w-full overflow-hidden rounded-full"
            }
          >
            <Image
              key={value}
              uri={value}
              className="h-full w-full"
              contentFit="cover"
              fallbackLogoSize={48}
            />
          </View>
        ) : (
          <View className="items-center justify-center gap-1 px-4">
            <View className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-gray-50-light">
              <AddPhotoIcon width={24} height={24} />
            </View>
            <Typography
              variant="text-14-regular-spaced"
              className="text-black text-center"
            >
              {t(labelTranslationKey)}
            </Typography>
          </View>
        )}
      </Pressable>
      <ImagePickerActions
        value={value}
        onRemove={onRemove}
        readOnly={readOnly}
        showPickFloat={false}
        floatClassName="absolute right-0 top-2 z-20"
        removeAccessibilityLabel={removeAccessibilityLabel}
      />
      {cropEditor}
    </View>
  );
};
