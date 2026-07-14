import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { User } from '../../User/objectType/User'

@ObjectType()
export class NotificationList {
  @Field(() => ID)
  id: string

  @Field(() => String)
  title: string

  @Field(() => String)
  body: string

  @Field(() => String, { nullable: true })
  image: string

  @Field(() => String)
  additionalParams: string

  @Field(() => Boolean)
  isRead: boolean

  @Field(() => User, { nullable: true })
  creator?: User

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}
