import { Field, ID, Int, ObjectType } from 'type-graphql'

@ObjectType('Voucher')
export class Voucher {
  @Field(() => ID)
  id: number

  @Field(() => String)
  code: string

  @Field(() => Int)
  amountMonths: string

  @Field(() => Int)
  amountMax: string

  @Field(() => String, { nullable: true })
  details: string

  @Field(() => Date, { nullable: true })
  endDate: Date
}
