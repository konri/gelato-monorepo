import 'reflect-metadata'
import { InputType, Field, Int } from 'type-graphql'

@InputType()
export class StoreSearchInput {
  @Field({ nullable: true })
  search?: string

  @Field({ nullable: true })
  city?: string

  @Field({ nullable: true })
  merchantId?: string

  @Field(() => Int, { defaultValue: 1 })
  page: number = 1

  @Field(() => Int, { defaultValue: 12 })
  pageSize: number = 12
}
