import { ObjectType, Field, ID, Int } from 'type-graphql'

@ObjectType()
export class CreateOrderResult {
  @Field(() => Int)
  orderNumber: number

  @Field(() => ID)
  orderId: string

  @Field(() => String, { nullable: true })
  note?: string | null
}
