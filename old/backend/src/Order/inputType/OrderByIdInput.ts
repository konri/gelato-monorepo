import { InputType, Field, ID } from 'type-graphql'

@InputType()
export class OrderByIdInput {
  @Field(() => ID)
  orderId: string
}
