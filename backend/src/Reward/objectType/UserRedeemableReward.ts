import { ObjectType, Field, ID, Int } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'

@ObjectType()
export class UserRedeemableReward {
  @Field(() => ID)
  id!: string

  @Field()
  type!: string // 'VOUCHER' | 'COUPON' | 'STAMP_CARD' | 'MILESTONE'

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
  pointsNeeded?: number

  @Field(() => Int, { nullable: true })
  stampsCollected?: number

  @Field(() => Int, { nullable: true })
  stampsRequired?: number

  @Field(() => Int, { nullable: true })
  stampsNeeded?: number

  @Field()
  canRedeem!: boolean

  @Field(() => Merchant)
  merchant!: Merchant

  @Field(() => MerchantStore, { nullable: true })
  store?: MerchantStore
}
