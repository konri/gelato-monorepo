import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType('PromoCode')
export class PromoCode {
  @Field(() => ID)
  id: string

  @Field(() => String)
  code: string

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => String)
  paymentCode: string

  @Field(() => String)
  userName?: string

  @Field(() => Boolean, { nullable: true })
  isVoucher: boolean
}
