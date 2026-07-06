import { pickImageFromLibrary } from "@/utils/pickImageFromLibrary";
import { ImageEditor, type ImageData } from "expo-dynamic-image-crop";
import React, { useCallback, useState } from "react";

type UsePickAndCropOptions = {
  cropAspect: number;
  onChange?: (uri: string) => void;
  readOnly?: boolean;
};

export function usePickAndCrop({
  cropAspect,
  onChange,
  readOnly = false,
}: UsePickAndCropOptions) {
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);

  const handlePick = useCallback(async () => {
    if (readOnly || !onChange) return;
    const uri = await pickImageFromLibrary();
    if (uri) setPendingCropUri(uri);
  }, [readOnly, onChange]);

  const handleCropComplete = useCallback(
    (result: ImageData) => {
      setPendingCropUri(null);
      onChange?.(result.uri);
    },
    [onChange],
  );

  const handleCropCancel = useCallback(() => {
    setPendingCropUri(null);
  }, []);

  const cropEditor =
    pendingCropUri !== null ? (
      <ImageEditor
        isVisible
        imageUri={pendingCropUri}
        fixedAspectRatio={cropAspect}
        onEditingComplete={handleCropComplete}
        onEditingCancel={handleCropCancel}
      />
    ) : null;

  return { handlePick, cropEditor };
}
