import type { SelectOption } from "@/components/atoms/FormSelect/types";
import type { CouponType } from "@/shared/api-client/src/graphql/mutations/coupon";

export type DiscountFieldsSharedProps = {
  discountTypeOptions: SelectOption[];
  discountValueLabel: string;
  discountValueHelper: string;
};

export type RewardPickerFieldsProps = {
  selectedRewardTitle?: string;
  onOpenRewardPicker: () => void;
  onClearRewardSelection: () => void;
  isRewardSelectionLocked?: boolean;
};

export type DayOfWeekCouponFieldsProps = DiscountFieldsSharedProps & {
  dayOfWeekOptions: SelectOption[];
};

export type ActivityCouponFieldsProps = DiscountFieldsSharedProps & {
  activityTypeOptions: SelectOption[];
};

export type CouponTypeSpecificFieldsProps = {
  couponType: CouponType;
  discountTypeOptions: SelectOption[];
  dayOfWeekOptions: SelectOption[];
  activityTypeOptions: SelectOption[];
  discountValueLabel: string;
  discountValueHelper: string;
  selectedRewardTitle?: string;
  onOpenRewardPicker: () => void;
  onClearRewardSelection: () => void;
  isRewardSelectionLocked?: boolean;
};
