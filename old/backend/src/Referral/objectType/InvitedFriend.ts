import 'reflect-metadata'
import { ObjectType, Field, ID, Int } from 'type-graphql'

@ObjectType()
export class InvitedFriend {
  @Field(() => ID)
  id: string

  @Field(() => String)
  name: string

  @Field(() => String)
  email: string

  @Field(() => String, { nullable: true })
  avatarUrl?: string

  @Field(() => String)
  joinedDate: string

  @Field(() => Int)
  points: number

  @Field(() => String)
  status: string

  @Field(() => String, { nullable: true })
  message?: string
}
