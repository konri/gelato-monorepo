import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'

@ObjectType()
export class UserReferralCode {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field(() => String)
  userId: string

  @Field(() => String)
  code: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
