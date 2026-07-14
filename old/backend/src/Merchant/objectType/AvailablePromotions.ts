import 'reflect-metadata'
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class PromotionVoucher {
  @Field(() => String)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  pointsCost!: number

  @Field(() => Int)
  value!: number
}

@ObjectType()
export class PromotionStampCard {
  @Field(() => String)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  stampsRequired!: number

  @Field(() => String, { nullable: true })
  rewardTitle?: string
}

@ObjectType()
export class PromotionCoupon {
  @Field(() => String)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => Int, { nullable: true })
  pointsCost?: number

  @Field(() => String, { nullable: true })
  discountType?: string

  @Field(() => Int, { nullable: true })
  discountValue?: number
}

@ObjectType()
export class AvailablePromotions {
  @Field(() => Boolean)
  hasPromotions!: boolean

  @Field(() => [PromotionVoucher])
  vouchers!: PromotionVoucher[]

  @Field(() => [PromotionStampCard])
  stampCards!: PromotionStampCard[]

  @Field(() => [PromotionCoupon])
  coupons!: PromotionCoupon[]
}
