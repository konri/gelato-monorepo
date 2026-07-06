import 'reflect-metadata'
import { ObjectType, Field, ID } from 'type-graphql'
import { User } from '../../User/objectType/User'

@ObjectType()
export class UserPointBalance {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  userId: string

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
