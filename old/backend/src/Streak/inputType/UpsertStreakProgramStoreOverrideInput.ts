import { Field, InputType, Int } from 'type-graphql'

@InputType()
export class UpsertStreakProgramStoreOverrideInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  description?: string

  @Field(() => Int, { nullable: true })
  requiredConsecutiveDays?: number

  @Field(() => Int, { nullable: true })
  streakingInterval?: number

  @Field(() => Int, { nullable: true })
  graceDays?: number

  @Field({ nullable: true })
  timezone?: string

  @Field({ nullable: true })
  repeatable?: boolean

  @Field({ nullable: true })
  isActive?: boolean
}
