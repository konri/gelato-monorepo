import { Field, ID, Int, ObjectType } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { Reward } from '../../Reward/objectType/Reward'
import { StreakBenefitType } from './StreakBenefitType'
import { StreakingPolicy } from './StreakingPolicy'
import { StreakStage } from './StreakStage'

@ObjectType()
export class StreakProgram {
  @Field(() => ID)
  id: string

  @Field(() => Merchant)
  merchant: Merchant

  @Field()
  merchantId: string

  @Field(() => Reward, { nullable: true })
  reward?: Reward

  @Field({ nullable: true })
  rewardId?: string

  @Field(() => [StreakStage])
  stages: StreakStage[]

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field(() => Int)
  requiredConsecutiveDays: number

  @Field(() => StreakingPolicy)
  streakingPolicy: StreakingPolicy

  @Field(() => Int)
  streakingInterval: number

  @Field({ nullable: true })
  timezone?: string

  @Field(() => Int)
  graceDays: number

  @Field()
  repeatable: boolean

  @Field()
  isActive: boolean

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  @Field(() => [String], { nullable: true })
  availableStoreIds?: string[]
}

@ObjectType()
export class UserStreakStatus {
  @Field(() => StreakProgram)
  streakProgram: StreakProgram

  @Field(() => Int)
  currentStreak: number

  @Field(() => Int)
  longestStreak: number

  @Field(() => Int)
  claimableRewardsCount: number

  @Field(() => Int)
  claimedCycles: number

  @Field(() => Int)
  requiredConsecutiveDays: number

  @Field(() => Int)
  remainingDaysToReward: number

  @Field({ nullable: true })
  lastVisitLocalDate?: Date
}

@ObjectType()
export class StreakRewardClaim {
  @Field(() => ID)
  id: string

  @Field()
  userId: string

  @Field()
  merchantId: string

  @Field()
  streakProgramId: string

  @Field({ nullable: true })
  rewardId?: string

  @Field(() => StreakBenefitType)
  benefitType: StreakBenefitType

  @Field({ nullable: true })
  infoMessage?: string

  @Field({ nullable: true })
  pointsMultiplier?: number

  @Field(() => Int, { nullable: true })
  pointsAmount?: number

  @Field({ nullable: true })
  streakStageId?: string

  @Field(() => Int)
  cycleNumber: number

  @Field()
  claimedAt: Date

  @Field()
  createdAt: Date
}
