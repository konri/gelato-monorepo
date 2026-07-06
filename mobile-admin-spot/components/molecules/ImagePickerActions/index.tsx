import AddPhotoIcon from "@/assets/images/add_photo_icon.svg";
import {
  FloatImageActionAnchor,
  FloatRoundImageControl,
} from "@/components/molecules/ImagePicker/FloatRoundImageControl";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ImagePickerActionsProps } from "./types";

export const ImagePickerActions = ({
  value,
  onPick,
  onRemove,
  readOnly = false,
  showPickFloat = true,
  floatClassName = "absolute right-0 top-2 z-20",
  pickAccessibilityLabel,
  removeAccessibilityLabel,
}: ImagePickerActionsProps) => {
  const { t } = useTranslation();
  const pickLabel = pickAccessibilityLabel ?? t("Common.editPhoto");
  const removeLabel = removeAccessibilityLabel ?? t("Common.removePhoto");

  if (readOnly) return null;

  const showRemove = Boolean(value && onRemove);
  const showPick = showPickFloat && Boolean(onPick) && (!value || !onRemove);

  if (!showRemove && !showPick) return null;

  return (
    <FloatImageActionAnchor className={floatClassName}>
      {showRemove ? (
        <FloatRoundImageControl
          onPress={onRemove}
          accessibilityLabel={removeLabel}
          icon="trash-outline"
        />
      ) : (
        <FloatRoundImageControl
          onPress={() => {
            void onPick?.();
          }}
          accessibilityLabel={pickLabel}
          icon={value != null ? "create-outline" : undefined}
          iconSize={value != null ? 18 : 16}
        >
          {value == null ? <AddPhotoIcon width={16} height={16} /> : null}
        </FloatRoundImageControl>
      )}
    </FloatImageActionAnchor>
  );
};
