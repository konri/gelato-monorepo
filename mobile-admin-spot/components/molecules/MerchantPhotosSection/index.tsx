import { Image } from "@/components/atoms/Image";
import { Typography } from "@/components/atoms/Typography";
import { CircularMerchantLogoPicker } from "@/components/molecules/CircularMerchantLogoPicker";
import { ImagePickerActions } from "@/components/molecules/ImagePickerActions";
import { usePickAndCrop } from "@/hooks/usePickAndCrop";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { MerchantPhotosSectionProps } from "./types";

const coverImageLayoutStyle = {
  width: "100%" as const,
  height: "100%" as const,
  minHeight: 144,
};

const COVER_CROP_ASPECT = 16 / 9;

export const MerchantPhotosSection = ({
  coverUri,
  logoUri,
  onCoverChange,
  onLogoChange,
  onCoverRemove,
  onLogoRemove,
  editing = false,
  layout = "merchant",
  readOnly = false,
}: MerchantPhotosSectionProps) => {
  const { t } = useTranslation();
  const isStoreLayout = layout === "store";

  const { handlePick: handlePickCover, cropEditor: coverCropEditor } = usePickAndCrop({
    cropAspect: COVER_CROP_ASPECT,
    onChange: onCoverChange,
    readOnly,
  });

  const coverPickAccessibilityLabel = isStoreLayout
    ? t("Store.changeStorePhoto")
    : t("Merchant.changeCoverPhoto");
  const coverRemoveAccessibilityLabel = isStoreLayout
    ? t("Store.removeStorePhoto")
    : t("Merchant.removeCoverPhoto");

  const tapCoverToChange =
    Boolean(coverUri) && onCoverChange != null && onCoverRemove != null;

  const outerClassName = isStoreLayout
    ? "relative h-36 w-full"
    : "relative h-merchant-photo-stack w-full";

  const coverInnerClassName = isStoreLayout
    ? `absolute inset-0 overflow-hidden rounded-2xl bg-gray-200${
        editing ? " shadow-sm" : ""
      }`
    : `absolute top-0 w-full overflow-hidden rounded-2xl bg-gray-200${
        editing ? " h-36 min-h-36 shadow-sm" : " h-36"
      }`;

  const useEditingImageLayout = editing;

  const renderCoverImage = () => {
    if (!coverUri) {
      return null;
    }
    const fillClass = useEditingImageLayout
      ? "h-full min-h-36 w-full"
      : "h-full w-full";
    const img = (
      <Image
        key={coverUri}
        source={{ uri: coverUri }}
        className={fillClass}
        style={coverImageLayoutStyle}
        contentFit="cover"
        fallbackLogoSize={64}
      />
    );
    if (tapCoverToChange) {
      return (
        <Pressable
          onPress={() => {
            void handlePickCover();
          }}
          accessibilityLabel={coverPickAccessibilityLabel}
          className={fillClass}
        >
          {img}
        </Pressable>
      );
    }
    return img;
  };

  const emptyEditingCover =
    !readOnly && onCoverChange != null ? (
      <Pressable
        onPress={() => {
          void handlePickCover();
        }}
        accessibilityLabel={coverPickAccessibilityLabel}
        className="h-full min-h-36 w-full"
      >
        <Image
          source={null}
          className="h-full min-h-36 w-full"
          contentFit="cover"
          fallbackLogoSize={64}
        />
      </Pressable>
    ) : (
      <Image
        source={null}
        className="h-full min-h-36 w-full"
        contentFit="cover"
        fallbackLogoSize={64}
      />
    );

  const renderTextOnlyPlaceholder = () => {
    const useMerchantCopy = !isStoreLayout;
    const title = useMerchantCopy
      ? t("Merchant.addCompanyPhoto")
      : t("Store.storePhotoTitle");
    const description = useMerchantCopy
      ? t("Merchant.companyPhotoDescription")
      : t("Store.storePhotoDescription");
    const paddingClass = useMerchantCopy ? "px-4 pb-14" : "px-4";
    const canPick = !readOnly && onCoverChange != null;
    const textBlock = (
      <>
        <Typography
          variant="text-12-regular"
          className="text-center text-black"
        >
          {title}
        </Typography>
        <Typography
          variant="text-10-medium"
          className="mt-1 text-center font-normal text-muted-text"
        >
          {description}
        </Typography>
      </>
    );
    if (canPick) {
      return (
        <Pressable
          onPress={() => {
            void handlePickCover();
          }}
          accessibilityLabel={coverPickAccessibilityLabel}
          className={`h-full w-full items-center justify-center ${paddingClass}`}
        >
          {textBlock}
        </Pressable>
      );
    }
    return (
      <View
        className={`flex-1 items-center justify-center ${paddingClass}`}
      >
        {textBlock}
      </View>
    );
  };

  const renderCoverBody = () => {
    if (coverUri) {
      return renderCoverImage();
    }
    if (editing) {
      return emptyEditingCover;
    }
    return renderTextOnlyPlaceholder();
  };

  return (
    <View className={outerClassName}>
      <View className={coverInnerClassName}>
        {renderCoverBody()}
        <ImagePickerActions
          value={coverUri ?? null}
          onPick={() => {
            void handlePickCover();
          }}
          onRemove={onCoverRemove}
          readOnly={readOnly}
          showPickFloat
          floatClassName="absolute right-2.5 top-2.5 z-10"
          pickAccessibilityLabel={coverPickAccessibilityLabel}
          removeAccessibilityLabel={coverRemoveAccessibilityLabel}
        />
      </View>
      {!isStoreLayout ? (
        <CircularMerchantLogoPicker
          className="absolute left-1/2 top-36 z-[3] h-25 w-25 -translate-x-1/2 -translate-y-1/2"
          variant={editing ? "elevated" : "stack"}
          imageUri={logoUri}
          readOnly={readOnly}
          onChange={onLogoChange}
          onRemove={onLogoRemove}
        />
      ) : null}
      {coverCropEditor}
    </View>
  );
};
