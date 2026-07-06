import React from "react";
import { ActivityCouponFields } from "./ActivityCouponFields";
import { BirthdayCouponFields } from "./BirthdayCouponFields";
import { DayOfWeekCouponFields } from "./DayOfWeekCouponFields";
import { DiscountCouponFields } from "./DiscountCouponFields";
import { ItemSpecificCouponFields } from "./ItemSpecificCouponFields";
import { MultiBuyCouponFields } from "./MultiBuyCouponFields";
import { ThresholdDiscountCouponFields } from "./ThresholdDiscountCouponFields";
import type { CouponTypeSpecificFieldsProps } from "./types";

export const CouponTypeSpecificFields = ({
  couponType,
  discountTypeOptions,
  dayOfWeekOptions,
  activityTypeOptions,
  discountValueLabel,
  discountValueHelper,
  selectedRewardTitle,
  onOpenRewardPicker,
  onClearRewardSelection,
  isRewardSelectionLocked,
}: CouponTypeSpecificFieldsProps) => {
  const fieldsByCouponType = {
    MULTI_BUY: (
      <MultiBuyCouponFields
        selectedRewardTitle={selectedRewardTitle}
        onOpenRewardPicker={onOpenRewardPicker}
        onClearRewardSelection={onClearRewardSelection}
        isRewardSelectionLocked={isRewardSelectionLocked}
      />
    ),
    DISCOUNT: (
      <DiscountCouponFields
        discountTypeOptions={discountTypeOptions}
        discountValueLabel={discountValueLabel}
        discountValueHelper={discountValueHelper}
      />
    ),
    DAY_OF_WEEK: (
      <DayOfWeekCouponFields
        dayOfWeekOptions={dayOfWeekOptions}
        discountTypeOptions={discountTypeOptions}
        discountValueLabel={discountValueLabel}
        discountValueHelper={discountValueHelper}
      />
    ),
    THRESHOLD_DISCOUNT: <ThresholdDiscountCouponFields />,
    ITEM_SPECIFIC: (
      <ItemSpecificCouponFields
        discountTypeOptions={discountTypeOptions}
        discountValueLabel={discountValueLabel}
        discountValueHelper={discountValueHelper}
        selectedRewardTitle={selectedRewardTitle}
        onOpenRewardPicker={onOpenRewardPicker}
        onClearRewardSelection={onClearRewardSelection}
        isRewardSelectionLocked={isRewardSelectionLocked}
      />
    ),
    BIRTHDAY: (
      <BirthdayCouponFields
        discountTypeOptions={discountTypeOptions}
        discountValueLabel={discountValueLabel}
        discountValueHelper={discountValueHelper}
      />
    ),
    ACTIVITY: (
      <ActivityCouponFields
        activityTypeOptions={activityTypeOptions}
        discountTypeOptions={discountTypeOptions}
        discountValueLabel={discountValueLabel}
        discountValueHelper={discountValueHelper}
      />
    ),
  } as const;

  return fieldsByCouponType[couponType];
};
