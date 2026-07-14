import { Field, Float, ID, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class SubscriptionPlan {
  @Field(() => ID)
  id: number

  @Field(() => String)
  paymentCode: string

  @Field(() => String)
  name: string

  @Field(() => Boolean, { nullable: true })
  mostPopular?: boolean

  @Field(() => Boolean, { nullable: true })
  private?: boolean

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Int)
  amountMembers: number
}
