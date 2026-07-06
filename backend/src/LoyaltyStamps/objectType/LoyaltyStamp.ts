import { ObjectType, Field, ID } from 'type-graphql'
import { LoyaltyStampCard } from './LoyaltyStampCard'

@ObjectType()
export class LoyaltyStamp {
  @Field(() => ID)
  id: string

  @Field(() => LoyaltyStampCard)
  card: LoyaltyStampCard

  @Field()
  cardId: string

  @Field()
  isUsed: boolean

  @Field({ nullable: true })
  usedAt?: Date

  @Field(() => String, { nullable: true })
  metadata?: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
