import { Field, ID, Int, ObjectType } from 'type-graphql'
import { VoucherCard } from './VoucherCard'
import { VoucherCardBuySessionStatus } from './VoucherCardBuySessionStatus'

@ObjectType('VoucherCardBuySession')
export class VoucherCardBuySession {
  @Field(() => ID)
  id: number

  @Field(() => VoucherCard)
  voucherCard: VoucherCard

  @Field(() => VoucherCardBuySessionStatus)
  paymentStatus: VoucherCardBuySessionStatus

  @Field(() => String)
  email: string

  @Field(() => String)
  userName: string

  @Field(() => String)
  codePrefix: string

  @Field(() => Int)
  quantity: number

  @Field(() => String)
  paymentId: string

  @Field(() => String)
  paymentIntentId: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
