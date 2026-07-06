import { InputType, Field } from 'type-graphql'
import { MilestoneType } from '../objectType/StampMilestone'

@InputType()
export class CreateStampMilestoneInput {
  @Field()
  stampsRequired: number

  @Field({ nullable: true })
  rewardId?: string

  // Legacy fields (deprecated - use rewardId instead)
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
}
