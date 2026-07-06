import type {
  CouponType,
  DiscountType,
} from "@/shared/api-client/src/graphql/mutations/coupon";
import type { CouponFormData } from "@/utils/couponForm";
import { useEffect, useRef } from "react";
import { useFormState, useWatch, type UseFormReturn } from "react-hook-form";
import { getCouponDefaultTexts } from "./defaultCouponTexts";
import {
  COUPON_DESCRIPTION_MAX_LENGTH,
  COUPON_SHORT_DESCRIPTION_MAX_LENGTH,
  COUPON_TITLE_MAX_LENGTH,
} from "./textLimits";

type Translate = (key: string, options?: Record<string, unknown>) => string;

type UseCouponTypeDefaultsParams = {
  form: UseFormReturn<CouponFormData>;
  t: Translate;
  enabled?: boolean;
  isEditMode?: boolean;
};

type UseCouponTypeDefaultsResult = {
  couponType: CouponType;
  discountType: DiscountType;
};

const COUPON_TYPE_INPUT_FIELDS: Array<keyof CouponFormData> = [
  "couponType",
  "discountType",
  "discountValue",
  "buyQuantity",
  "getQuantity",
  "dayOfWeek",
  "thresholdAmount",
  "discountAmount",
  "itemName",
  "activityType",
];

export const useCouponTypeDefaults = ({
  form,
  t,
  enabled = true,
  isEditMode = false,
}: UseCouponTypeDefaultsParams): UseCouponTypeDefaultsResult => {
  const limitTextLength = (value: string, maxLength: number) =>
    value.length > maxLength ? value.slice(0, maxLength) : value;

  const { dirtyFields } = useFormState({
    control: form.control,
  });
  const isTitleDirty = !!dirtyFields.title;
  const isShortDescriptionDirty = !!dirtyFields.shortDescription;
  const isDescriptionDirty = !!dirtyFields.description;
  const isTermsAndConditionDirty = !!dirtyFields.termsAndCondition;
  const isCouponTypeInputDirty = COUPON_TYPE_INPUT_FIELDS.some(
    (fieldName) => !!dirtyFields[fieldName],
  );
  const hasCouponTypeInputBeenModified = useRef(!isEditMode);

  const [
    watchedCouponType,
    watchedDiscountType,
    buyQuantity,
    getQuantity,
    discountValue,
    dayOfWeek,
    thresholdAmount,
    discountAmount,
    itemName,
    activityType,
  ] = useWatch({
    control: form.control,
    name: [
      "couponType",
      "discountType",
      "buyQuantity",
      "getQuantity",
      "discountValue",
      "dayOfWeek",
      "thresholdAmount",
      "discountAmount",
      "itemName",
      "activityType",
    ],
  });

  const couponType = watchedCouponType ?? "DISCOUNT";
  const discountType = watchedDiscountType ?? "PERCENTAGE";

  useEffect(() => {
    if (isCouponTypeInputDirty) {
      hasCouponTypeInputBeenModified.current = true;
    }
  }, [isCouponTypeInputDirty]);

  useEffect(() => {
    if (!enabled || !hasCouponTypeInputBeenModified.current) {
      return;
    }

    const defaults = getCouponDefaultTexts({
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
    });
    const limitedTitle = limitTextLength(
      defaults.title,
      COUPON_TITLE_MAX_LENGTH,
    );
    const limitedShortDescription = limitTextLength(
      defaults.shortDescription,
      COUPON_SHORT_DESCRIPTION_MAX_LENGTH,
    );
    const limitedDescription = limitTextLength(
      defaults.description,
      COUPON_DESCRIPTION_MAX_LENGTH,
    );
    const termsAndCondition = defaults.termsAndCondition;

    if (!isTitleDirty && form.getValues("title") !== limitedTitle) {
      form.setValue("title", limitedTitle, { shouldDirty: false });
    }

    if (
      !isShortDescriptionDirty &&
      form.getValues("shortDescription") !== limitedShortDescription
    ) {
      form.setValue("shortDescription", limitedShortDescription, {
        shouldDirty: false,
      });
    }

    if (
      !isDescriptionDirty &&
      form.getValues("description") !== limitedDescription
    ) {
      form.setValue("description", limitedDescription, { shouldDirty: false });
    }

    if (
      !isTermsAndConditionDirty &&
      form.getValues("termsAndCondition") !== termsAndCondition
    ) {
      form.setValue("termsAndCondition", termsAndCondition, {
        shouldDirty: false,
      });
    }
  }, [
    activityType,
    buyQuantity,
    couponType,
    dayOfWeek,
    discountAmount,
    discountType,
    discountValue,
    form,
    getQuantity,
    isDescriptionDirty,
    enabled,
    isEditMode,
    isShortDescriptionDirty,
    isTermsAndConditionDirty,
    isTitleDirty,
    itemName,
    t,
    thresholdAmount,
  ]);

  return { couponType, discountType };
};
