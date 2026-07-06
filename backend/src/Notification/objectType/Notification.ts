import { Authorized, Field, ID, ObjectType } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { User } from '../../User/objectType/User'

@ObjectType('Notification')
export class Notification {
  @Field(() => ID)
  id: string

  @Authorized(Role.ADMIN)
  @Field(() => User)
  user: User

  @Field(() => String)
  token: string

  @Field(() => Date, { nullable: true })
  createdAt: Date

  @Field(() => Date, { nullable: true })
  updatedAt: Date
}
