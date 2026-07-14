import { Field, ID, Int, ObjectType } from 'type-graphql'
import { Reward } from '../../Reward/objectType/Reward'
import { StreakBenefitType } from './StreakBenefitType'

@ObjectType()
export class StreakStage {
  @Field(() => ID)
  id: string

  @Field(() => Int)
  dayThreshold: number

  @Field(() => StreakBenefitType)
  benefitType: StreakBenefitType

  @Field(() => Reward, { nullable: true })
  reward?: Reward

  @Field({ nullable: true })
  rewardId?: string

  @Field({ nullable: true })
  infoMessage?: string

  @Field({ nullable: true })
  pointsMultiplier?: number

  @Field(() => Int, { nullable: true })
  pointsAmount?: number

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
