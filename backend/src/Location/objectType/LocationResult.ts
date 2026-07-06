import { ObjectType, Field, Float } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'
import { Coupon } from '../../Coupon/objectType/Coupon'

@ObjectType()
export class StoreWithDistance {
  @Field(() => MerchantStore)
  store: MerchantStore

  @Field(() => Float)
  distanceKm: number

  @Field(() => Merchant)
  merchant: Merchant

  @Field(() => Boolean)
  isFavorite: boolean

  @Field(() => String)
  favoriteIconUrl: string

  @Field(() => String)
  favoriteIconPngUrl: string

  @Field(() => Boolean)
  hasStreak: boolean

  @Field(() => String, { nullable: true })
  streakIconPngUrl?: string
}

@ObjectType()
export class CouponWithDistance {
  @Field(() => Coupon)
  coupon: Coupon

  @Field(() => Float)
  distanceKm: number

  @Field(() => MerchantStore)
  store: MerchantStore

  @Field(() => Merchant)
  merchant: Merchant
}

@ObjectType()
export class LocationSearchResult {
  @Field(() => [StoreWithDistance])
  stores: StoreWithDistance[]

  @Field(() => [CouponWithDistance])
  coupons: CouponWithDistance[]

  @Field(() => Float)
  searchLatitude: number

  @Field(() => Float)
  searchLongitude: number

  @Field(() => Float)
  searchRadiusKm: number
}
