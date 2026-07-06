import 'reflect-metadata'
import { ObjectType, Field, ID, Int } from 'type-graphql'
import { Merchant } from './Merchant'
import { MerchantStore } from './MerchantStore'
import { VoucherDisplayType } from './VoucherDisplayType'

@ObjectType()
export class MerchantVoucher {
  @Field(() => ID)
  id: string

  @Field(() => Merchant)
  merchant: Merchant

  @Field(() => String)
  merchantId: string

  @Field(() => MerchantStore, { nullable: true })
  store?: MerchantStore

  @Field(() => String, { nullable: true })
  storeId?: string

  @Field(() => String)
  title: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Int)
  value: number

  @Field(() => Int)
  pointsCost: number

  @Field(() => String, { nullable: true })
  imageUrl?: string

  @Field(() => VoucherDisplayType)
  displayType: VoucherDisplayType

  @Field(() => Int)
  priority: number

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => Date, { nullable: true })
  validFrom?: Date

  @Field(() => Date, { nullable: true })
  validUntil?: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
