import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { User } from '../../User/objectType/User'

@ObjectType()
export class Client {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}
