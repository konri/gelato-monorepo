import 'reflect-metadata'
import { ObjectType, Field, ID, Int } from 'type-graphql'
import { User } from '../../User/objectType/User'

@ObjectType()
export class Referral {
  @Field(() => ID)
  id: string

  @Field(() => User)
  referrer: User

  @Field(() => String)
  referrerId: string

  @Field(() => User)
  referredUser: User

  @Field(() => String)
  referredUserId: string

  @Field(() => String)
  referralCode: string

  @Field(() => Int)
  pointsAwarded: number

  @Field(() => Boolean)
  isCompleted: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
