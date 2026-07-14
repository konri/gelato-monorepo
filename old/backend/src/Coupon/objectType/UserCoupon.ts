import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { Coupon } from './Coupon'

@ObjectType()
export class UserCoupon {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field(() => Coupon)
  coupon: Coupon

  @Field()
  couponId: string

  @Field()
  qrCode: string

  @Field()
  isUsed: boolean

  @Field({ nullable: true })
  usedAt?: Date

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
