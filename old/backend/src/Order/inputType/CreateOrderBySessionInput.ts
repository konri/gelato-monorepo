import { InputType, Field } from 'type-graphql'

@InputType()
export class CreateOrderBySessionInput {
  @Field()
  sessionToken: string

  @Field()
  merchantStoreId: string

  @Field(() => String, { nullable: true })
  note?: string | null
}
