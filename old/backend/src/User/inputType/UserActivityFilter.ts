import 'reflect-metadata'
import { InputType, Field } from 'type-graphql'
import { ActivityType, ActivityStatus } from '../objectType/UserActivity'

@InputType()
export class UserActivityFilter {
  @Field(() => [ActivityType], { nullable: true })
  types?: ActivityType[]

  @Field(() => [ActivityStatus], { nullable: true })
  statuses?: ActivityStatus[]

  @Field(() => String, { nullable: true })
  merchantId?: string

  @Field(() => String, { nullable: true })
  searchText?: string
}
