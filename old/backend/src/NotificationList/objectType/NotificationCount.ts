import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class NotificationCount {
  @Field(() => Int)
  count: number
}
