import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { User } from '../../User/objectType/User'

@ObjectType()
export class UserWithExtraId extends User {
  @Field(() => ID)
  userId?: string
}
