import type {
  AvailabilityType,
  CouponType,
  CreateCouponInput,
  DiscountType,
  UpdateCouponInput,
  UpsertCouponStoreOverrideInput,
  VoucherDisplayType,
} from "@/shared/api-client/src/graphql/mutations/coupon";

export type CouponFormData = {
  code: string;
  title: string;
  shortDescription?: string;
  description?: string;
  termsAndCondition?: string;
  couponType: CouponType;
  availability: AvailabilityType;
  displayType: VoucherDisplayType;
  pointsCost?: string;
  rewardId?: string;
  validFrom: string;
  validUntil: string;
  imageUrl?: string;
  usesPerUserLimit?: string;
  globalUsageLimit?: string;
  assignToUserId?: string;
  assignToUserEmail?: string;
  exclusivityGroups?: string[];
  buyQuantity?: string;
  getQuantity?: string;
  discountType?: DiscountType;
  discountValue?: string;
  dayOfWeek?: string;
  thresholdAmount?: string;
  discountAmount?: string;
  itemName?: string;
  itemBarcode?: string;
  daysBeforeBirthday?: string;
  daysAfterBirthday?: string;
  activityType?: string;
  isStackable: boolean;
  isActive: boolean;
};

export const COUPON_TYPES: CouponType[] = [
  "MULTI_BUY",
  "DISCOUNT",
  "DAY_OF_WEEK",
  "THRESHOLD_DISCOUNT",
  "ITEM_SPECIFIC",
  "BIRTHDAY",
  "ACTIVITY",
];

export const AVAILABILITY_TYPES: AvailabilityType[] = ["FREE", "POINTS"];

export const DISPLAY_TYPES: VoucherDisplayType[] = [
  "HOT",
  "PROMOTED",
  "STANDARD",
];

export const DISCOUNT_TYPES: DiscountType[] = ["PERCENTAGE", "AMOUNT"];

export const ACTIVITY_TYPES = [
  "INSTAGRAM_SHARE",
  "FACEBOOK_SHARE",
  "REFERRAL",
  "REVIEW",
  "CUSTOM",
] as const;

export const EXCLUSIVITY_GROUPS = [
  "discount",
  "promo",
  "seasonal",
  "birthday",
  "loyalty",
  "first-time",
] as const;

export const getCouponTypeOptions = (t: (key: string) => string) =>
  COUPON_TYPES.map((value) => ({ label: t(`Coupon.type${value}`), value }));

export const getAvailabilityTypeOptions = (t: (key: string) => string) =>
  AVAILABILITY_TYPES.map((value) => ({
    label: t(`Coupon.availability${value}`),
    value,
  }));

export const getDisplayTypeOptions = (t: (key: string) => string) =>
  DISPLAY_TYPES.map((value) => ({ label: t(`Coupon.display${value}`), value }));

export const getDiscountTypeOptions = (t: (key: string) => string) =>
  DISCOUNT_TYPES.map((value) => ({
    label: t(`Coupon.discountType${value}`),
    value,
  }));

export const getActivityTypeOptions = (t: (key: string) => string) =>
  ACTIVITY_TYPES.map((value) => ({
    label: t(`Coupon.activityType${value}`),
    value,
  }));

export const getExclusivityGroupOptions = (t: (key: string) => string) =>
  EXCLUSIVITY_GROUPS.map((value) => ({
    label: t(`Coupon.exclusivityGroup${value}`),
    value,
  }));

export const DAY_OF_WEEK_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const getDayOfWeekOptions = (t: (key: string) => string) =>
  DAY_OF_WEEK_OPTIONS.map((value) => ({
    label: t(`Coupon.dayOfWeek${value}`),
    value,
  }));

const toNumberOrUndefined = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toStringArrayOrUndefined = (value?: string[]) => {
  if (!value || value.length === 0) {
    return undefined;
  }
  const groups = value
    .map((group) => group.trim())
    .filter((group) => group.length > 0);
  return groups.length > 0 ? groups : undefined;
};

const getCouponTypeFields = (data: CouponFormData): Partial<CreateCouponInput> => {
  switch (data.couponType) {
    case "MULTI_BUY":
      return {
        buyQuantity: toNumberOrUndefined(data.buyQuantity),
        getQuantity: toNumberOrUndefined(data.getQuantity),
      };
    case "DISCOUNT":
      return {
        discountType: data.discountType,
        discountValue: toNumberOrUndefined(data.discountValue),
      };
    case "DAY_OF_WEEK":
      return {
        dayOfWeek: data.dayOfWeek || undefined,
        discountType: data.discountType,
        discountValue: toNumberOrUndefined(data.discountValue),
      };
    case "THRESHOLD_DISCOUNT":
      return {
        thresholdAmount: toNumberOrUndefined(data.thresholdAmount),
        discountAmount: toNumberOrUndefined(data.discountAmount),
      };
    case "ITEM_SPECIFIC":
      return {
        itemName: data.itemName || undefined,
        itemBarcode: data.itemBarcode || undefined,
        discountType: data.discountType,
        discountValue: toNumberOrUndefined(data.discountValue),
      };
    case "BIRTHDAY":
      return {
        discountType: data.discountType,
        discountValue: toNumberOrUndefined(data.discountValue),
        daysBeforeBirthday: toNumberOrUndefined(data.daysBeforeBirthday),
        daysAfterBirthday: toNumberOrUndefined(data.daysAfterBirthday),
      };
    case "ACTIVITY":
      return {
        activityType: data.activityType || undefined,
        discountType: data.discountType,
        discountValue: toNumberOrUndefined(data.discountValue),
      };
    default:
      return {};
  }
};

export const buildCouponInput = (data: CouponFormData): CreateCouponInput => ({
  code: data.code,
  title: data.title,
  shortDescription: data.shortDescription || undefined,
  description: data.description || undefined,
  termsAndConditions: data.termsAndCondition || undefined,
  imageUrl: data.imageUrl || undefined,
  couponType: data.couponType,
  availability: data.availability,
  displayType: data.displayType,
  pointsCost: data.availability === "POINTS" ? toNumberOrUndefined(data.pointsCost) : undefined,
  rewardId: data.rewardId || undefined,
  validFrom: data.validFrom,
  validUntil: data.validUntil,
  usesPerUserLimit: toNumberOrUndefined(data.usesPerUserLimit),
  globalUsageLimit: toNumberOrUndefined(data.globalUsageLimit),
  assignToUserId: data.assignToUserId || undefined,
  exclusivityGroups: data.isStackable ? toStringArrayOrUndefined(data.exclusivityGroups) : undefined,
  isStackable: data.isStackable,
  isActive: data.isActive,
  ...getCouponTypeFields(data),
});

export const buildUpdateCouponInput = (data: CouponFormData): UpdateCouponInput => {
  const { code: _code, ...rawUpdateInput } = buildCouponInput(data);
  const updateInput: UpdateCouponInput = rawUpdateInput;

  if (data.availability === "FREE") {
    updateInput.pointsCost = null;
  }

  if (!data.rewardId) {
    updateInput.rewardId = null;
  }

  return updateInput;
};

export const buildCouponStoreOverrideInput = (
  data: CouponFormData,
): UpsertCouponStoreOverrideInput => {
  const typeFields = getCouponTypeFields(data);
  return {
    title: data.title,
    shortDescription: data.shortDescription || undefined,
    description: data.description || undefined,
    termsAndConditions: data.termsAndCondition || undefined,
    imageUrl: data.imageUrl || undefined,
    couponType: data.couponType,
    availability: data.availability,
    displayType: data.displayType,
    pointsCost:
      data.availability === "POINTS" ? toNumberOrUndefined(data.pointsCost) : undefined,
    rewardId: data.rewardId ? data.rewardId : undefined,
    validFrom: data.validFrom || undefined,
    validUntil: data.validUntil || undefined,
    usesPerUserLimit: toNumberOrUndefined(data.usesPerUserLimit),
    globalUsageLimit: toNumberOrUndefined(data.globalUsageLimit),
    assignToUserId: data.assignToUserId || undefined,
    exclusivityGroups: data.isStackable
      ? toStringArrayOrUndefined(data.exclusivityGroups)
      : undefined,
    isStackable: data.isStackable,
    isActive: data.isActive,
    ...typeFields,
  };
};
