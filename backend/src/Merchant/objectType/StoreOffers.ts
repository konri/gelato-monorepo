import 'reflect-metadata'
import { ObjectType, Field, Int } from 'type-graphql'
import { MerchantVoucher } from './MerchantVoucher'

@ObjectType()
export class StoreStampTemplate {
  @Field()
  id!: string

  @Field()
  title!: string

  @Field({ nullable: true })
  description?: string

  @Field(() => Int)
  stampsRequired!: number

  @Field({ nullable: true })
  rewardTitle?: string

  @Field({ nullable: true })
  rewardDescription?: string

  @Field()
  isActive!: boolean
}

@ObjectType()
export class StoreCoupon {
  @Field()
  id!: string

  @Field()
  code!: string

  @Field()
  title!: string

  @Field({ nullable: true })
  description?: string

  @Field()
  couponType!: string

  @Field()
  availability!: string

  @Field(() => Int, { nullable: true })
  pointsCost?: number

  @Field({ nullable: true })
  discountType?: string

  @Field(() => Int, { nullable: true })
  discountValue?: number

  @Field()
  validFrom!: Date

  @Field()
  validUntil!: Date

  @Field()
  isActive!: boolean
}

@ObjectType()
export class StoreOffers {
  @Field(() => [MerchantVoucher])
  vouchers!: MerchantVoucher[]

  @Field(() => [StoreStampTemplate])
  stampTemplates!: StoreStampTemplate[]

  @Field(() => [StoreCoupon])
  coupons!: StoreCoupon[]
}
