import { Field, InputType, Int } from 'type-graphql'

@InputType()
export class SubscriptionCompanyInput {
  @Field(() => String)
  companyId: string

  @Field(() => String)
  planId: string

  @Field(() => Int)
  amountMonths: number

  @Field(() => Date, { nullable: true })
  startDate?: Date
}
