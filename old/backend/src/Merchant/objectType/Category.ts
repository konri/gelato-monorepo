import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'
import { Merchant } from './Merchant'

@ObjectType()
export class Category {
  @Field(() => ID)
  id: string

  @Field(() => String)
  name: string

  @Field(() => String)
  slug: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String, { nullable: true })
  iconUrl?: string

  @Field(() => String, { nullable: true })
  iconPngUrl?: string

  @Field(() => [Merchant])
  merchants: Merchant[]

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
