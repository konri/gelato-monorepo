import { Authorized, Field, ID, ObjectType } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { Role } from '../../User/objectType/Role'

@ObjectType()
export class Feedback {
  @Field(() => ID)
  id: number

  @Authorized(Role.ADMIN)
  @Field(() => User)
  user: User

  @Field(() => String)
  topic: string

  @Field(() => String)
  comment: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
