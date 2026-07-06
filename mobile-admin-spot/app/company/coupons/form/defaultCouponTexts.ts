import type { CouponType, DiscountType } from "@/shared/api-client/src/graphql/mutations/coupon";

type Translate = (key: string, options?: Record<string, unknown>) => string;

const withFallback = (value: string | undefined, fallback: string) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
};

const resolveDiscountTitle = (
  discountType: DiscountType,
  discountValue: string | undefined,
) => {
  const normalizedValue = discountValue?.trim();
  if (!normalizedValue) {
    return discountType === "PERCENTAGE" ? "...%" : "...";
  }

  return discountType === "PERCENTAGE" ? `${normalizedValue}%` : normalizedValue;
};

type CouponDefaultsParams = {
  couponType: CouponType;
  discountType: DiscountType;
  discountValue?: string;
  buyQuantity?: string;
  getQuantity?: string;
  dayOfWeek?: string;
  thresholdAmount?: string;
  discountAmount?: string;
  itemName?: string;
  activityType?: string;
  t: Translate;
};

export const getCouponDefaultTexts = ({
  couponType,
  discountType,
  discountValue,
  buyQuantity,
  getQuantity,
  dayOfWeek,
  thresholdAmount,
  discountAmount,
  itemName,
  activityType,
  t,
}: CouponDefaultsParams) => {
  const discountTitle = resolveDiscountTitle(discountType, discountValue);
  const typeTitle = t(`Coupon.type${couponType}`);
  const typeShortDescription = t(`Coupon.type${couponType}Helper`);
  const resolveDescription = (shortDescription: string) =>
    t("Coupon.defaultLongDescriptionTemplate", {
      shortDescription,
      defaultValue: shortDescription,
    });
  const resolveTermsAndCondition = () =>
    t(`Coupon.defaultTerms${couponType}`, {
      defaultValue: t("Coupon.defaultTermsGeneric"),
    });

  if (couponType === "MULTI_BUY") {
    const buy = withFallback(buyQuantity, "X");
    const get = withFallback(getQuantity, "Y");
    const shortDescription = t("Coupon.defaultDescriptionMultiBuy", {
      buy,
      get,
    });
    return {
      title: `(${buy} + ${get})`,
      shortDescription,
      description: resolveDescription(shortDescription),
      termsAndCondition: resolveTermsAndCondition(),
    };
  }

  if (couponType === "DISCOUNT") {
    const shortDescription = typeShortDescription;
    return {
      title: discountTitle,
      shortDescription,
      description: resolveDescription(shortDescription),
      termsAndCondition: resolveTermsAndCondition(),
    };
  }

  if (couponType === "DAY_OF_WEEK") {
    const dayLabel = dayOfWeek
      ? t(`Coupon.dayOfWeek${dayOfWeek}`, { defaultValue: dayOfWeek })
      : t("Coupon.dayOfWeekPlaceholder", { defaultValue: "Dzien tygodnia" });
    const shortDescription = typeShortDescription;
    return {
      title: `${dayLabel} ${discountTitle}`,
      shortDescription,
      description: resolveDescription(shortDescription),
      termsAndCondition: resolveTermsAndCondition(),
    };
  }

  if (couponType === "THRESHOLD_DISCOUNT") {
    const threshold = withFallback(thresholdAmount, "X");
    const amount = withFallback(discountAmount, "Y");
    const shortDescription = t("Coupon.defaultDescriptionThresholdDiscount", {
      threshold,
      amount,
      defaultValue: `Wydaj min. ${threshold}, odbierz rabat ${amount}`,
    });
    return {
      title: `${amount} / ${threshold}`,
      shortDescription,
      description: resolveDescription(shortDescription),
      termsAndCondition: resolveTermsAndCondition(),
    };
  }

  if (couponType === "ITEM_SPECIFIC") {
    const item = withFallback(itemName, t("Coupon.itemNamePlaceholder"));
    const shortDescription = typeShortDescription;
    return {
      title: item,
      shortDescription,
      description: resolveDescription(shortDescription),
      termsAndCondition: resolveTermsAndCondition(),
    };
  }

  if (couponType === "ACTIVITY") {
    const activity = activityType
      ? t(`Coupon.activityType${activityType}`, { defaultValue: activityType })
      : typeTitle;
    const shortDescription = typeShortDescription;
    return {
      title: activity,
      shortDescription,
      description: resolveDescription(shortDescription),
      termsAndCondition: resolveTermsAndCondition(),
    };
  }

  const shortDescription = typeShortDescription;
  return {
    title: typeTitle,
    shortDescription,
    description: resolveDescription(shortDescription),
    termsAndCondition: resolveTermsAndCondition(),
  };
};
