import { Field, ID, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class AvailableRewardStatus {
  @Field(() => ID)
  id: string

  @Field()
  source: string

  @Field({ nullable: true })
  rewardId?: string

  @Field({ nullable: true })
  cardId?: string

  @Field({ nullable: true })
  milestoneId?: string

  @Field({ nullable: true })
  streakProgramId?: string

  @Field({ nullable: true })
  streakStageId?: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  merchantId?: string

  @Field({ nullable: true })
  merchantName?: string

  @Field(() => Int, { nullable: true })
  stampsCollected?: number

  @Field(() => Int, { nullable: true })
  stampsRequired?: number

  @Field(() => Int, { nullable: true })
  currentStreak?: number

  @Field(() => Int, { nullable: true })
  dayThreshold?: number

  @Field()
  canClaim: boolean
}
