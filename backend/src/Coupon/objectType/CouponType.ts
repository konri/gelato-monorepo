import { registerEnumType } from 'type-graphql'

export enum CouponType {
  MULTI_BUY = 'MULTI_BUY',
  DISCOUNT = 'DISCOUNT',
  DAY_OF_WEEK = 'DAY_OF_WEEK',
  THRESHOLD_DISCOUNT = 'THRESHOLD_DISCOUNT',
  ITEM_SPECIFIC = 'ITEM_SPECIFIC',
  BIRTHDAY = 'BIRTHDAY',
  ACTIVITY = 'ACTIVITY',
}

export enum AvailabilityType {
  FREE = 'FREE',
  POINTS = 'POINTS',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  AMOUNT = 'AMOUNT',
}

registerEnumType(CouponType, {
  name: 'CouponType',
  description: 'Type of coupon',
})

registerEnumType(AvailabilityType, {
  name: 'AvailabilityType',
  description: 'How coupon is available to users',
})

registerEnumType(DiscountType, {
  name: 'DiscountType',
  description: 'Type of discount (percentage or fixed amount)',
})

// Re-export VoucherDisplayType from Merchant
export { VoucherDisplayType } from '../../Merchant/objectType/VoucherDisplayType'
