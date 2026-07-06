import 'reflect-metadata'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'
import { User } from '../../User/objectType/User'

export enum TransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUND = 'REFUND',
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
})

@ObjectType()
export class PointTransaction {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field(() => TransactionType)
  type: TransactionType

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
