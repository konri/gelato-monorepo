import { Typography } from "@/components/atoms/Typography";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";
import { CouponCard } from "@/components/molecules/CouponCard";
import { ContextSwitcher } from "@/components/molecules/ContextSwitcher";
import { ImagePicker } from "@/components/molecules/ImagePicker";
import { PreviewFrame } from "@/components/molecules/PreviewFrame";
import React from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useCouponWizardForm } from "./_layout";

type CouponWizardStepContainerProps = {
  children: React.ReactNode;
};

const PREVIEW_SHORT_DESCRIPTION_MAX_LENGTH = 64;

export const CouponWizardStepContainer = ({
  children,
}: CouponWizardStepContainerProps) => {
  const { t } = useTranslation();
  const {
    form,
    couponImageDisplayUri,
    onCouponImagePick,
    onCouponImageRemovePress,
    isEditMode,
    isStoreOverrideEdit,
    canEditCoupons,
  } = useCouponWizardForm();
  const [title, shortDescription] = useWatch({
    control: form.control,
    name: ["title", "shortDescription"],
  });
  const normalizedShortDescription = shortDescription?.trim();
  const previewShortDescription = normalizedShortDescription
    ? normalizedShortDescription.length > PREVIEW_SHORT_DESCRIPTION_MAX_LENGTH
      ? `${normalizedShortDescription.slice(0, PREVIEW_SHORT_DESCRIPTION_MAX_LENGTH).trimEnd()}...`
      : normalizedShortDescription
    : undefined;

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-gray-50-light"
      contentContainerClassName="p-6 gap-4"
      showsVerticalScrollIndicator={false}
    >
      <Typography variant="text-20-bold" className="text-black">
        {isEditMode ? t("Coupon.editCoupon") : t("Coupon.createCoupon")}
      </Typography>
      <ContextSwitcher />
      {isStoreOverrideEdit ? (
        <Typography variant="text-14-regular-spaced" className="text-blue-900">
          {t("LoyaltyConfig.storeOverrideCouponBanner")}
        </Typography>
      ) : null}
      <PreviewFrame>
        <View className="py-2 relative">
          <CouponCard
            discountText={title || t("Coupon.titlePreviewPlaceholder")}
            title={previewShortDescription}
            imageUrl={couponImageDisplayUri ?? undefined}
            useGrayImagePlaceholder
          />
          <View className="absolute left-0 top-2 bottom-2 w-32 overflow-hidden rounded-l-14">
            <ImagePicker
              value={couponImageDisplayUri}
              previewShape="rectangle"
              cropAspect={[4, 5]}
              readOnly={!canEditCoupons}
              onChange={(uri) => {
                onCouponImagePick(uri);
              }}
              onRemove={onCouponImageRemovePress}
              removeAccessibilityLabel={t("Loyalty.removeRewardImage")}
            />
          </View>
        </View>
      </PreviewFrame>
      {children}
    </KeyboardAwareScrollView>
  );
};
