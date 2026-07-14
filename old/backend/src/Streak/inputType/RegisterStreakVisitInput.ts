import { Field, InputType } from 'type-graphql'

@InputType()
export class RegisterStreakVisitInput {
  @Field()
  streakProgramId: string

  @Field({ nullable: true })
  userId?: string

  @Field({ nullable: true })
  visitAt?: Date

  @Field({ nullable: true })
  timezone?: string

  @Field({ nullable: true })
  source?: string

  @Field({ nullable: true })
  idempotencyKey?: string

  @Field()
  merchantStoreId: string
}
