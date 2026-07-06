export type CouponType =
  | "MULTI_BUY"
  | "DISCOUNT"
  | "DAY_OF_WEEK"
  | "THRESHOLD_DISCOUNT"
  | "ITEM_SPECIFIC"
  | "BIRTHDAY"
  | "ACTIVITY";

export type AvailabilityType = "FREE" | "POINTS";

export type DiscountType = "PERCENTAGE" | "AMOUNT";

export type VoucherDisplayType = "HOT" | "PROMOTED" | "STANDARD";

export type CreateCouponInput = {
  code: string;
  title: string;
  shortDescription?: string;
  description?: string;
  termsAndConditions?: string;
  imageUrl?: string;
  couponType: CouponType;
  availability: AvailabilityType;
  displayType?: VoucherDisplayType;
  pointsCost?: number;
  rewardId?: string;
  validFrom: string;
  validUntil: string;
  assignToUserId?: string;
  exclusivityGroups?: string[];
  buyQuantity?: number;
  getQuantity?: number;
  discountType?: DiscountType;
  discountValue?: number;
  dayOfWeek?: string;
  thresholdAmount?: number;
  discountAmount?: number;
  itemName?: string;
  itemBarcode?: string;
  daysBeforeBirthday?: number;
  daysAfterBirthday?: number;
  activityType?: string;
  usesPerUserLimit?: number;
  globalUsageLimit?: number;
  isStackable?: boolean;
  isActive?: boolean;
};

export type UpdateCouponInput = Partial<
  Omit<
    CreateCouponInput,
    | "code"
    | "description"
    | "imageUrl"
    | "pointsCost"
    | "rewardId"
    | "assignToUserId"
    | "exclusivityGroups"
    | "buyQuantity"
    | "getQuantity"
    | "discountValue"
    | "dayOfWeek"
    | "thresholdAmount"
    | "discountAmount"
    | "itemName"
    | "itemBarcode"
    | "daysBeforeBirthday"
    | "daysAfterBirthday"
    | "activityType"
    | "usesPerUserLimit"
    | "globalUsageLimit"
  >
> & {
  shortDescription?: string | null;
  description?: string | null;
  termsAndConditions?: string | null;
  imageUrl?: string | null;
  pointsCost?: number | null;
  rewardId?: string | null;
  assignToUserId?: string | null;
  exclusivityGroups?: string[] | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  discountValue?: number | null;
  dayOfWeek?: string | null;
  thresholdAmount?: number | null;
  discountAmount?: number | null;
  itemName?: string | null;
  itemBarcode?: string | null;
  daysBeforeBirthday?: number | null;
  daysAfterBirthday?: number | null;
  activityType?: string | null;
  usesPerUserLimit?: number | null;
  globalUsageLimit?: number | null;
};

export type Coupon = {
  id: string;
  code: string;
  title: string;
  shortDescription?: string;
  description?: string;
  termsAndConditions?: string;
  imageUrl?: string;
  couponType: CouponType;
  availability: AvailabilityType;
  pointsCost?: number;
  displayType: VoucherDisplayType;
  priority: number;
  distance?: number;
  merchantId: string;
  rewardId?: string;
  validFrom: string;
  validUntil: string;
  assignToUserId?: string;
  exclusivityGroups?: string[];
  buyQuantity?: number;
  getQuantity?: number;
  discountType?: DiscountType;
  discountValue?: number;
  dayOfWeek?: string;
  thresholdAmount?: number;
  discountAmount?: number;
  itemName?: string;
  itemBarcode?: string;
  daysBeforeBirthday?: number;
  daysAfterBirthday?: number;
  activityType?: string;
  isActive: boolean;
  availableStoreIds?: string[];
  currentUses: number;
  usesPerUserLimit?: number;
  globalUsageLimit?: number;
  isStackable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCouponResponse = {
  createCoupon: Coupon;
};

export type UpdateCouponResponse = {
  updateCoupon: Coupon;
};

export type CreateCouponVariables = {
  data: CreateCouponInput;
  storeId?: string;
};

export type UpdateCouponVariables = {
  data: UpdateCouponInput;
  couponId: string;
};

export type UpsertCouponStoreOverrideInput = Partial<Omit<CreateCouponInput, "code">> & {
  pointsCost?: number | null;
  rewardId?: string | null;
  assignToUserId?: string | null;
  exclusivityGroups?: string[] | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  discountValue?: number | null;
  dayOfWeek?: string | null;
  thresholdAmount?: number | null;
  discountAmount?: number | null;
  itemName?: string | null;
  itemBarcode?: string | null;
  daysBeforeBirthday?: number | null;
  daysAfterBirthday?: number | null;
  activityType?: string | null;
  usesPerUserLimit?: number | null;
  globalUsageLimit?: number | null;
  isActive?: boolean;
};

export type UpsertCouponStoreOverrideResponse = {
  upsertCouponStoreOverride: Coupon;
};

export type UpsertCouponStoreOverrideVariables = {
  couponId: string;
  storeId: string;
  data: UpsertCouponStoreOverrideInput;
};
