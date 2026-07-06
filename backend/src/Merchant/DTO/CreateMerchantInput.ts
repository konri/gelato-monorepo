import { InputType, Field } from 'type-graphql'

@InputType()
export class CreateMerchantInput {
  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field()
  categoryId: string

  @Field({ nullable: true })
  logoUrl?: string

  @Field({ nullable: true })
  coverUrl?: string

  @Field({ nullable: true })
  iconUrl?: string
}
