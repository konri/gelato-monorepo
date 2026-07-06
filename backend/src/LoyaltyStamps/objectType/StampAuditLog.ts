import { ObjectType, Field, ID } from 'type-graphql'
import { LoyaltyStampCard } from './LoyaltyStampCard'

@ObjectType()
export class StampAuditLog {
  @Field(() => ID)
  id: string

  @Field(() => LoyaltyStampCard)
  card: LoyaltyStampCard

  @Field()
  cardId: string

  @Field()
  userId: string

  @Field()
  merchantId: string

  @Field()
  action: string

  @Field()
  stampsBefore: number

  @Field()
  stampsAfter: number

  @Field(() => String, { nullable: true })
  metadata?: string

  @Field()
  createdAt: Date
}
