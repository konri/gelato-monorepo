import 'reflect-metadata'
import { ObjectType, Field, ID, Float, Int } from 'type-graphql'
import { Merchant } from './Merchant'
import { Category } from './Category'
import { AvailablePromotions } from './AvailablePromotions'
import { MerchantStoreOrderQueueConfig } from '../../Order/objectType/MerchantStoreOrderQueueConfig'

@ObjectType()
export class StoreImage {
  @Field()
  url!: string

  @Field()
  type!: string

  @Field()
  alt!: string
}

@ObjectType()
export class StoreStampCard {
  @Field(() => Int)
  current!: number

  @Field(() => Int)
  required!: number

  @Field()
  reward!: string

  @Field()
  isUsed!: boolean

  @Field()
  isActive!: boolean

  @Field()
  canRedeem!: boolean

  @Field({ nullable: true })
  canActivate?: boolean

  @Field({ nullable: true })
  templateId?: string
}

@ObjectType()
export class StorePromotion {
  @Field(() => ID)
  id!: string

  @Field()
  title!: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field(() => Int, { nullable: true })
  value?: number

  @Field(() => Int, { nullable: true })
  pointsCost?: number
}

@ObjectType()
export class RedeemableReward {
  @Field(() => ID)
  id!: string

  @Field()
  type!: string // 'VOUCHER' | 'COUPON' | 'STAMP_CARD'

  @Field()
  title!: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field({ nullable: true })
  stampCoverUrl?: string

  @Field({ nullable: true })
  stampStickerIconUrl?: string

  @Field(() => Int, { nullable: true })
  pointsCost?: number

  @Field(() => Int, { nullable: true })
  userPoints?: number

  @Field(() => Int, { nullable: true })
  pointsNeeded?: number // 0 if can redeem, >0 if needs more

  @Field(() => Int, { nullable: true })
  stampsCollected?: number

  @Field(() => Int, { nullable: true })
  stampsRequired?: number

  @Field(() => Int, { nullable: true })
  stampsNeeded?: number

  @Field()
  canRedeem!: boolean
}

@ObjectType()
export class MerchantStore {
  @Field(() => ID)
  id!: string

  @Field()
  name!: string

  @Field({ nullable: true })
  description?: string

  @Field()
  address!: string

  @Field()
  city!: string

  @Field({ nullable: true })
  phone?: string

  @Field({ nullable: true })
  postalCode?: string

  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  country?: string

  @Field({ nullable: true })
  openingHours?: string

  @Field(() => Float, { nullable: true })
  latitude?: number

  @Field(() => Float, { nullable: true })
  longitude?: number

  @Field({ nullable: true })
  logoUrl?: string

  @Field({ nullable: true })
  photoUrl?: string

  @Field(() => [StoreImage])
  images!: StoreImage[]

  @Field()
  isActive!: boolean

  @Field()
  merchantId!: string

  @Field(() => Merchant)
  merchant!: Merchant

  @Field(() => Category, { nullable: true })
  category?: Category

  @Field(() => AvailablePromotions, { nullable: true })
  availablePromotions?: AvailablePromotions

  @Field(() => Float, { nullable: true })
  distanceKm?: number

  @Field(() => StoreStampCard, { nullable: true })
  stampCard?: StoreStampCard

  @Field(() => Int, { nullable: true })
  userPoints?: number

  @Field(() => [StorePromotion], { nullable: true })
  promotions?: StorePromotion[]

  @Field(() => [RedeemableReward], { nullable: true })
  redeemableRewards?: RedeemableReward[]

  @Field(() => MerchantStoreOrderQueueConfig, { nullable: true })
  orderQueueSettings?: MerchantStoreOrderQueueConfig | null

  @Field()
  createdAt!: Date

  @Field()
  updatedAt!: Date
}
