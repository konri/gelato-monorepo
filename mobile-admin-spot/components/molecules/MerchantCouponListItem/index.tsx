import { Typography } from "@/components/atoms/Typography";
import { CouponCard } from "@/components/molecules/CouponCard";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { MerchantCouponListItemProps } from "./types";

const PREVIEW_SHORT_DESCRIPTION_MAX_LENGTH = 64;

const formatCouponDate = (value: string, locale: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const MerchantCouponListItem = ({ coupon, onPress, scopeLabel }: MerchantCouponListItemProps) => {
  const { t, i18n } = useTranslation();
  const normalizedShortDescription = coupon.shortDescription?.trim();
  const previewShortDescription = normalizedShortDescription
    ? normalizedShortDescription.length > PREVIEW_SHORT_DESCRIPTION_MAX_LENGTH
      ? `${normalizedShortDescription
          .slice(0, PREVIEW_SHORT_DESCRIPTION_MAX_LENGTH)
          .trimEnd()}...`
      : normalizedShortDescription
    : undefined;

  const validUntil = useMemo(
    () => formatCouponDate(coupon.validUntil, i18n.language),
    [coupon.validUntil, i18n.language],
  );

  return (
    <Pressable
      className="gap-3"
      onPress={onPress ? () => onPress(coupon.id) : undefined}
      disabled={!onPress}
    >
      <CouponCard
        discountText={coupon.title || t("Coupon.titlePreviewPlaceholder")}
        title={previewShortDescription}
        imageUrl={coupon.imageUrl || undefined}
      />
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <View className="bg-blue-extra-light px-3 py-1 rounded-full-pill">
            <Typography variant="text-12-semibold" className="text-blue-900">
              {t(`Coupon.display${coupon.displayType}`)}
            </Typography>
          </View>
          {scopeLabel ? (
            <View className="bg-gray-100 px-3 py-1 rounded-full-pill">
              <Typography variant="text-12-regular" className="text-gray-700">
                {scopeLabel}
              </Typography>
            </View>
          ) : null}
        </View>
        {validUntil && (
          <Typography variant="text-12-regular" className="text-gray-600">
            {t("Coupon.validUntil")}: {validUntil}
          </Typography>
        )}
      </View>
    </Pressable>
  );
};
