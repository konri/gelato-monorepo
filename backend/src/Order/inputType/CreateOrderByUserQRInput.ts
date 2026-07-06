import { InputType, Field, ID } from 'type-graphql'

@InputType()
export class CreateOrderByUserQRInput {
  @Field(() => ID, { nullable: true })
  userId?: string | null

  @Field()
  merchantStoreId: string

  @Field(() => String, { nullable: true })
  note?: string | null
}
