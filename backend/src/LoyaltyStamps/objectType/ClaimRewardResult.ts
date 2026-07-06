import { ObjectType, Field, createUnionType } from 'type-graphql'
import { ClaimedMilestone } from './ClaimedMilestone'
import { LoyaltyStampCard } from './LoyaltyStampCard'

@ObjectType()
export class ClaimRewardResult {
  @Field(() => String)
  type: 'MILESTONE' | 'MAIN_REWARD'

  @Field(() => ClaimedMilestone, { nullable: true })
  claimedMilestone?: ClaimedMilestone

  @Field(() => LoyaltyStampCard, { nullable: true })
  stampCard?: LoyaltyStampCard
}
