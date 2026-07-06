import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { MerchantVoucher } from './MerchantVoucher'

@ObjectType()
export class UserMerchantVoucher {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field(() => MerchantVoucher)
  merchantVoucher: MerchantVoucher

  @Field()
  merchantVoucherId: string

  @Field()
  qrCode: string

  @Field()
  isUsed: boolean

  @Field(() => Date, { nullable: true })
  usedAt?: Date

  @Field(() => Date)
  validUntil: Date

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
