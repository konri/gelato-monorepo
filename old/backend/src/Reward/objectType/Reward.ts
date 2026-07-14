import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'

export enum RewardSourceType {
  STAMP_CARD = 'STAMP_CARD',
  POINTS = 'POINTS',
  CASH = 'CASH',
  SUBSCRIPTION = 'SUBSCRIPTION',
  REFERRAL = 'REFERRAL',
  ACTIVITY = 'ACTIVITY',
}

export enum RewardValueType {
  FREE_SERVICE = 'FREE_SERVICE',
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  DISCOUNT_AMOUNT = 'DISCOUNT_AMOUNT',
  PRODUCT = 'PRODUCT',
  POINTS = 'POINTS',
  CASH_VOUCHER = 'CASH_VOUCHER',
}

registerEnumType(RewardSourceType, { name: 'RewardSourceType' })
registerEnumType(RewardValueType, { name: 'RewardValueType' })

@ObjectType()
export class Reward {
  @Field(() => ID)
  id: string

  @Field(() => Merchant, { nullable: true })
  merchant?: Merchant

  @Field({ nullable: true })
  merchantId?: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field(() => RewardSourceType)
  sourceType: RewardSourceType

  @Field(() => RewardValueType)
  valueType: RewardValueType

  @Field({ nullable: true })
  discountPercent?: number

  @Field({ nullable: true })
  discountAmount?: number

  @Field({ nullable: true })
  pointsValue?: number

  @Field({ nullable: true })
  cashValue?: number

  @Field({ nullable: true })
  productName?: string

  @Field({ nullable: true })
  maxUsesPerUser?: number

  @Field({ nullable: true })
  totalQuantity?: number

  @Field()
  currentUses: number

  @Field()
  isActive: boolean

  @Field({ nullable: true })
  validFrom?: Date

  @Field({ nullable: true })
  validUntil?: Date

  @Field(() => String, { nullable: true })
  metadata?: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  @Field(() => [String], { nullable: true })
  availableStoreIds?: string[]
}
