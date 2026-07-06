import { Field, InputType, Int } from 'type-graphql'
import { StreakBenefitType } from '../objectType/StreakBenefitType'

@InputType()
export class CreateStreakStageInput {
  @Field(() => Int)
  dayThreshold: number

  @Field(() => StreakBenefitType, { nullable: true })
  benefitType?: StreakBenefitType

  @Field({ nullable: true })
  rewardId?: string

  @Field({ nullable: true })
  infoMessage?: string

  @Field({ nullable: true })
  pointsMultiplier?: number

  @Field(() => Int, { nullable: true })
  pointsAmount?: number
}
