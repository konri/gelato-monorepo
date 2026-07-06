import { gql } from "@apollo/client";

export const COUPON_FIELDS_FRAGMENT = gql`
  fragment CouponFields on Coupon {
    id
    code
    title
    shortDescription
    description
    termsAndConditions
    imageUrl
    couponType
    availability
    displayType
    pointsCost
    priority
    merchantId
    rewardId
    validFrom
    validUntil
    assignToUserId
    exclusivityGroups
    buyQuantity
    getQuantity
    discountType
    discountValue
    dayOfWeek
    thresholdAmount
    discountAmount
    itemName
    itemBarcode
    daysBeforeBirthday
    daysAfterBirthday
    activityType
    isActive
    currentUses
    usesPerUserLimit
    globalUsageLimit
    isStackable
    availableStoreIds
    createdAt
    updatedAt
  }
`;
