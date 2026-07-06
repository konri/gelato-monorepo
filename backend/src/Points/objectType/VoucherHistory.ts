import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'

@ObjectType()
export class VoucherHistory {
  @Field(() => ID)
  id: string

  @Field()
  userId: string

  @Field()
  voucherType: string

  @Field()
  voucherId: string

  @Field()
  voucherCode: string

  @Field()
  voucherTitle: string

  @Field()
  action: string

  @Field(() => Number, { nullable: true })
  pointsSpent?: number | null

  @Field(() => String, { nullable: true })
  metadata?: any

  @Field()
  createdAt: Date
}
