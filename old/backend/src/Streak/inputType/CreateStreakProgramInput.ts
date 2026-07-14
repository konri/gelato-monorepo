import { Field, InputType, Int } from 'type-graphql'
import { CreateStreakStageInput } from './CreateStreakStageInput'
import { StreakingPolicy } from '../objectType/StreakingPolicy'

@InputType()
export class CreateStreakProgramInput {
  @Field({ nullable: true })
  merchantId?: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field(() => StreakingPolicy, { defaultValue: StreakingPolicy.DAILY })
  streakingPolicy: StreakingPolicy

  @Field(() => Int, { defaultValue: 1 })
  streakingInterval: number

  @Field({ nullable: true })
  timezone?: string

  @Field(() => Int, { defaultValue: 0 })
  graceDays: number

  @Field({ defaultValue: false })
  repeatable: boolean

  @Field(() => [CreateStreakStageInput])
  stages: CreateStreakStageInput[]

  @Field({ defaultValue: true })
  isActive: boolean
}
