import { Field, InputType, Int } from 'type-graphql'

@InputType()
export class VoucherInput {
  @Field(() => String)
  code: string

  @Field(() => String)
  planId: string

  @Field(() => Int)
  amountMonths: number

  @Field(() => Int)
  amountMax: number

  @Field(() => String, { nullable: true })
  details?: string

  @Field(() => Boolean, { nullable: true })
  separateVoucher: boolean

  @Field(() => String, { nullable: true })
  name: string

  @Field(() => String, { nullable: true })
  email: string
}
