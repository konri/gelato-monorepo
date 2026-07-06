import { Field, Float, InputType, Int } from 'type-graphql'

@InputType()
export class CompanyUpdateInput {
  @Field(() => String, { nullable: true })
  name: string

  @Field(() => String, { nullable: true })
  description: string

  @Field(() => String, { nullable: true })
  taxId?: string

  @Field(() => String, { nullable: true })
  logoId?: string

  @Field(() => String, { nullable: true })
  address: string

  @Field(() => String, { nullable: true })
  city: string

  @Field(() => String, { nullable: true })
  postalCode?: string

  @Field(() => String, { nullable: true })
  country: string

  @Field(() => [String], { nullable: true })
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
