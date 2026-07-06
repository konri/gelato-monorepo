import { Field, ID, ObjectType } from 'type-graphql'
import { Company } from '../../CompanyOwner/objectType/Comapny'
import { SubscriptionPlan } from './SubscriptionPlan'

@ObjectType()
export class SubscriptionCompany {
  @Field(() => ID)
  id: string

  @Field(() => Company)
  company: Company

  @Field(() => SubscriptionPlan)
  plan: SubscriptionPlan

  @Field()
  startDate: Date

  @Field()
  endDate: Date

  @Field(() => String, { nullable: true })
  promoCode?: string

  @Field()
  firstSeen: Date

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
