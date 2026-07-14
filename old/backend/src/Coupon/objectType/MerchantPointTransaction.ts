import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { TransactionType } from '../../Points/objectType/PointTransaction'

@ObjectType()
export class MerchantPointTransaction {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field(() => Merchant)
  merchant: Merchant

  @Field()
  merchantId: string

  @Field({ nullable: true })
  merchantPointsProgramId?: string

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
