import { InputType, Field, ID } from 'type-graphql'

@InputType()
export class MarkOrderReadyInput {
  @Field(() => ID)
  orderId: string
}
