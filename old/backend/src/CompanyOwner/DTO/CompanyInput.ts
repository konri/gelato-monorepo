import { Field, InputType, Int } from 'type-graphql'

@InputType()
export class CompanyInput {
  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String)
  taxId: string

  @Field(() => String, { nullable: true })
  logoId?: string

  @Field(() => String)
  address: string

  @Field(() => String)
  city: string

  @Field(() => String, { nullable: true })
  postalCode?: string

  @Field(() => String)
  country: string

  @Field(() => [String])
  cityOperate: string[]

  @Field(() => String, { nullable: true })
  phone: string

  @Field(() => String, { nullable: true })
  email: string

  @Field(() => String, { nullable: true })
  website: string

  @Field(() => String, { nullable: true })
  facebook: string

  @Field(() => String, { nullable: true })
  instagram: string

  @Field(() => String, { nullable: true })
  tiktok: string
}
