import { Field, InputType } from 'type-graphql'

@InputType()
export class SubscriptionCompanyRevenueCatInput {
  @Field(() => String)
  startDate: string

  @Field(() => String)
  endDate: string

  @Field(() => String)
  firstSeen: string

  @Field(() => String)
  promoCode: string

  @Field(() => String)
  originalAppUserId: string

  @Field(() => String)
  paymentId: string

  @Field(() => String)
  store: string

  @Field(() => String)
  identifier: string

  @Field(() => Boolean)
  autoRenewal: boolean
}
