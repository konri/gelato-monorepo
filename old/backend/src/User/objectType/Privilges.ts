import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { IsEmail } from 'class-validator'
import { Role } from './Role'
import { User } from './User'

@ObjectType()
export class Privileges {
  @Authorized([Role.NEW_USER, Role.OWNER, Role.CLIENT, Role.COOPERATOR, Role.ADMIN])
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field(() => String)
  privileges: string

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}
