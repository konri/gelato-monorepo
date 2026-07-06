import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { LoyaltyStampCard } from './LoyaltyStampCard'

export enum StampTransactionType {
  EARNED = 'EARNED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

registerEnumType(StampTransactionType, {
  name: 'StampTransactionType',
})

@ObjectType()
export class StampTransaction {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field(() => LoyaltyStampCard)
  card: LoyaltyStampCard

  @Field()
  cardId: string

  @Field(() => StampTransactionType)
  type: StampTransactionType

  @Field()
  amount: number

  @Field()
  description: string

  @Field({ nullable: true })
  referenceId?: string

  @Field({ nullable: true })
  referenceType?: string

  @Field()
  balanceBefore: number

  @Field()
  balanceAfter: number

  @Field()
  createdAt: Date
}
