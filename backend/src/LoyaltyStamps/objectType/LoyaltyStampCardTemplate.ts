import { ObjectType, Field, ID } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { LoyaltyStampCard } from './LoyaltyStampCard'
import { StampMilestone, RewardType } from './StampMilestone'
import { Reward } from '../../Reward/objectType/Reward'

@ObjectType()
export class LoyaltyStampCardTemplate {
  @Field(() => ID)
  id: string

  @Field(() => Merchant)
  merchant: Merchant

  @Field()
  merchantId: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  stampCoverUrl?: string

  @Field({ nullable: true })
  stampStickerIconUrl?: string

  @Field()
  stampsRequired: number

  @Field({ nullable: true })
  awardType?: string

  @Field({ nullable: true })
  minimumAmount?: number

  @Field(() => Reward, { nullable: true })
  reward?: Reward

  @Field({ nullable: true })
  rewardId?: string

  // Legacy fields (deprecated)
  @Field(() => RewardType)
  rewardType: RewardType

  @Field({ nullable: true })
  rewardTitle?: string

  @Field({ nullable: true })
  rewardDescription?: string

  @Field({ nullable: true })
  rewardDiscountPercent?: number

  @Field({ nullable: true })
  rewardDiscountAmount?: number

  @Field({ nullable: true })
  rewardImageUrl?: string

  @Field()
  resetStampsOnMilestoneClaim: boolean

  @Field()
  isActive: boolean

  @Field({ nullable: true })
  validFrom?: Date

  @Field({ nullable: true })
  validUntil?: Date

  @Field(() => String, { nullable: true })
  metadata?: string

  @Field(() => [LoyaltyStampCard])
  stampCards: LoyaltyStampCard[]

  @Field(() => [StampMilestone], { nullable: true })
  milestones?: StampMilestone[]

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
