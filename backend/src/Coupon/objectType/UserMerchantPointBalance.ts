import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { Merchant } from '../../Merchant/objectType/Merchant'

@ObjectType()
export class UserMerchantPointBalance {
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

  @Field()
  totalPoints: number

  @Field()
  availablePoints: number

  @Field()
  lockedPoints: number

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
