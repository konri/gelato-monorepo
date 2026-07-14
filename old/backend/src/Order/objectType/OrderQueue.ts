import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class OrderQueueResponse {
  @Field(() => [Int])
  preparing: number[]

  @Field(() => [Int])
  delayed: number[]

  @Field(() => [Int])
  ready: number[]

  @Field(() => Int, { nullable: true })
  lastReadyOrderNumber?: number
}
