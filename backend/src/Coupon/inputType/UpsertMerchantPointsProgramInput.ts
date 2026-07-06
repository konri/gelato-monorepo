import { Field, InputType } from 'type-graphql'

@InputType()
export class UpsertMerchantPointsProgramInput {
  @Field()
  amountSpent: number

  @Field()
  pointsAwarded: number

  @Field({ nullable: true })
  cardMessage?: string

  @Field({ nullable: true })
  isActive?: boolean
}
