import { Field, InputType, Int } from 'type-graphql'
import { CreateStreakStageInput } from './CreateStreakStageInput'
import { StreakingPolicy } from '../objectType/StreakingPolicy'

@InputType()
export class UpdateStreakProgramInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  description?: string

  @Field(() => StreakingPolicy, { nullable: true })
  streakingPolicy?: StreakingPolicy

  @Field(() => Int, { nullable: true })
  streakingInterval?: number

  @Field({ nullable: true })
  timezone?: string

  @Field(() => Int, { nullable: true })
  graceDays?: number

  @Field({ nullable: true })
  repeatable?: boolean

  @Field(() => [CreateStreakStageInput], { nullable: true })
  stages?: CreateStreakStageInput[]

  @Field({ nullable: true })
  isActive?: boolean
}
