import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { Coupon } from './Coupon'

@ObjectType()
export class CouponUsage {
  @Field(() => ID)
  id: string

  @Field(() => Coupon)
  coupon: Coupon

  @Field()
  couponId: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

  @Field()
  usedAt: Date

  @Field({ nullable: true })
  remainingUses?: number

  @Field({ nullable: true })
  metadata?: string
}
