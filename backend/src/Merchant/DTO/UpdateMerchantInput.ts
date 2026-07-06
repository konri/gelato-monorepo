import 'reflect-metadata'
import { InputType, Field } from 'type-graphql'

@InputType()
export class UpdateMerchantInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  logoUrl?: string

  @Field({ nullable: true })
  coverUrl?: string

  @Field({ nullable: true })
  iconUrl?: string

  @Field({ nullable: true })
  categoryId?: string
}
