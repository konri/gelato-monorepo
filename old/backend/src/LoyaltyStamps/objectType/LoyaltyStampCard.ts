import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { LoyaltyStamp } from './LoyaltyStamp'
import { StampTransaction } from './StampTransaction'
import { StampAuditLog } from './StampAuditLog'
import { LoyaltyStampCardTemplate } from './LoyaltyStampCardTemplate'
import { ClaimedMilestone } from './ClaimedMilestone'
import { StampMilestone } from './StampMilestone'

@ObjectType()
export class RewardDetails {
  @Field(() => String)
  title: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String)
  type: string

  @Field(() => Number, { nullable: true })
  discountPercent?: number

  @Field(() => Number, { nullable: true })
  discountAmount?: number
}

@ObjectType()
export class MainRewardStatus {
  @Field(() => String, { nullable: true })
  id?: string

  @Field(() => Boolean)
  isAvailable: boolean

  @Field(() => Boolean)
  canClaim: boolean

  @Field(() => Boolean)
  isClaimed: boolean

  @Field(() => Boolean)
  isRedeemed: boolean

  @Field(() => Boolean)
  isReadyToRedeem: boolean

  @Field(() => RewardDetails, { nullable: true })
  rewardDetails?: RewardDetails

  @Field(() => Date, { nullable: true })
  claimedAt?: Date

  @Field(() => Date, { nullable: true })
  redeemedAt?: Date
}

@ObjectType()
export class AvailableReward {
  @Field(() => String)
  type: 'MILESTONE' | 'MAIN_REWARD'

  @Field(() => StampMilestone, { nullable: true })
  milestone?: StampMilestone

  @Field(() => String, { nullable: true })
  mainRewardTitle?: string

  @Field(() => String, { nullable: true })
  mainRewardDescription?: string

  @Field(() => String, { nullable: true })
  mainRewardType?: string

  @Field(() => Number, { nullable: true })
  mainRewardDiscountPercent?: number

  @Field(() => Number, { nullable: true })
  mainRewardDiscountAmount?: number
}

@ObjectType()
export class LoyaltyStampCard {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field(() => Merchant)
  merchant: Merchant

  @Field()
  merchantId: string

  @Field(() => LoyaltyStampCardTemplate, { nullable: true })
  template?: LoyaltyStampCardTemplate

  @Field({ nullable: true })
  templateId?: string

  @Field()
  stampsRequired: number

  @Field()
  stampsCollected: number

  @Field()
  stampsUsed: number

  @Field()
  isActive: boolean

  @Field({ nullable: true })
  usedAt?: Date

  @Field(() => MainRewardStatus, { nullable: true })
  mainRewardClaimed?: MainRewardStatus

  @Field({ nullable: true })
  validUntil?: Date

  @Field(() => String, { nullable: true })
  metadata?: string

  @Field(() => [LoyaltyStamp])
  stamps: LoyaltyStamp[]

  @Field(() => [StampTransaction])
  transactions: StampTransaction[]

  @Field(() => [StampAuditLog])
  auditLogs: StampAuditLog[]

  @Field(() => [ClaimedMilestone])
  claimedMilestones: ClaimedMilestone[]

  @Field(() => [AvailableReward])
  availableRewards: AvailableReward[]

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
