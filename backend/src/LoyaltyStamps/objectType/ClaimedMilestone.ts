import { ObjectType, Field, ID } from 'type-graphql'
import { StampMilestone } from './StampMilestone'
import { LoyaltyStampCard } from './LoyaltyStampCard'

@ObjectType()
export class ClaimedMilestone {
  @Field(() => ID)
  id: string

  @Field()
  cardId: string

  @Field(() => LoyaltyStampCard)
  card: LoyaltyStampCard

  @Field({ nullable: true })
  milestoneId?: string

  @Field(() => StampMilestone, { nullable: true })
  milestone?: StampMilestone

  @Field(() => Boolean)
  isAvailable: boolean

  @Field(() => Boolean)
  isClaimed: boolean

  @Field()
  isRedeemed: boolean

  @Field(() => Boolean)
  isReadyToRedeem: boolean

  @Field({ nullable: true })
  redeemedAt?: Date

  @Field()
  claimedAt: Date

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
