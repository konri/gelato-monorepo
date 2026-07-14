import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'
import { Reward } from '../../Reward/objectType/Reward'

export enum RewardType {
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  DISCOUNT_AMOUNT = 'DISCOUNT_AMOUNT',
  FREE_SERVICE = 'FREE_SERVICE',
}

registerEnumType(RewardType, {
  name: 'RewardType',
})

export enum MilestoneType {
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  DISCOUNT_AMOUNT = 'DISCOUNT_AMOUNT',
  FREE_SERVICE = 'FREE_SERVICE',
  POINTS_REWARD = 'POINTS_REWARD',
}

registerEnumType(MilestoneType, {
  name: 'MilestoneType',
})

@ObjectType()
export class StampMilestone {
  @Field(() => ID)
  id: string

  @Field()
  templateId: string

  @Field()
  stampsRequired: number

  @Field(() => Reward, { nullable: true })
  reward?: Reward

  @Field({ nullable: true })
  rewardId?: string

  // Legacy fields (deprecated)
  @Field(() => MilestoneType)
  milestoneType: MilestoneType

  @Field({ nullable: true })
  discountPercent?: number

  @Field({ nullable: true })
  discountAmount?: number

  @Field({ nullable: true })
  pointsReward?: number

  @Field({ nullable: true })
  imageUrl?: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field()
  isActive: boolean

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
