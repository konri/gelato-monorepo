import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType()
export class ClaimedRewardStatus {
  @Field(() => ID)
  id: string

  @Field()
  source: string

  @Field({ nullable: true })
  rewardId?: string

  @Field({ nullable: true })
  streakProgramId?: string

  @Field({ nullable: true })
  streakStageId?: string

  @Field({ nullable: true })
  cardId?: string

  @Field({ nullable: true })
  milestoneId?: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  merchantId?: string

  @Field({ nullable: true })
  merchantName?: string

  @Field()
  claimedAt: Date

  @Field({ nullable: true })
  isRedeemed?: boolean

  @Field({ nullable: true })
  redeemedAt?: Date
}
