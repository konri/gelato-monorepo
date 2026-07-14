import { InputType, Field } from 'type-graphql'
import { CreateStampMilestoneInput } from './CreateStampMilestoneInput'
import { RewardType } from '../objectType/StampMilestone'

@InputType()
export class CreateStampCardTemplateInput {
  @Field()
  merchantId: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  stampStickerIconUrl?: string

  @Field()
  stampsRequired: number

  @Field({ nullable: true })
  awardType?: string

  @Field({ nullable: true })
  minimumAmount?: number

  @Field({ nullable: true })
  rewardId?: string

  // Legacy fields (deprecated - use rewardId instead)
  @Field(() => RewardType, { nullable: true })
  rewardType?: RewardType

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

  @Field({ nullable: true })
  resetStampsOnMilestoneClaim?: boolean

  @Field({ nullable: true })
  validFrom?: Date

  @Field({ nullable: true })
  validUntil?: Date

  @Field({ nullable: true })
  isActive?: boolean

  @Field(() => [CreateStampMilestoneInput], { nullable: true })
  milestones?: CreateStampMilestoneInput[]
}
