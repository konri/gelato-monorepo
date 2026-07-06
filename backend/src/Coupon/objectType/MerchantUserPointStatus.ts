import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class MerchantUserPointStatus {
  @Field()
  userId: string

  @Field()
  merchantId: string

  @Field()
  totalPoints: number

  @Field()
  availablePoints: number

  @Field()
  lockedPoints: number

  @Field({ nullable: true })
  bonusMultiplier?: number

  @Field({ nullable: true })
  fixedPoints?: number

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
