import { ObjectType, Field, ID } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'

@ObjectType()
export class MerchantPointsProgram {
  @Field(() => ID)
  id: string

  @Field(() => Merchant)
  merchant: Merchant

  @Field()
  merchantId: string

  @Field()
  amountSpent: number

  @Field()
  pointsAwarded: number

  @Field({ nullable: true })
  cardMessage?: string

  @Field()
  isActive: boolean

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
