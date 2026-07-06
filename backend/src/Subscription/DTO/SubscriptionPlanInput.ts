import { Field, InputType, Int } from 'type-graphql'

@InputType()
export class SubscriptionPlanInput {
  @Field(() => String)
  paymentCode: string

  @Field(() => String)
  name: string

  @Field(() => Boolean, { nullable: true })
  mostPopular?: boolean

  @Field(() => Boolean, { nullable: true })
  privatePlan?: boolean

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Int)
  amountMembers: number
}
