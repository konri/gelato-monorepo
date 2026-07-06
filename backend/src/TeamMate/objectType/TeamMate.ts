import { Authorized, Field, ID, ObjectType } from 'type-graphql'
import { Role } from '../../User/objectType/Role'

@ObjectType()
export class TeamMate {
  @Field(() => ID)
  id: string

  @Field(() => String)
  name: string

  @Field(() => String)
  title: string

  @Field(() => String)
  description: string

  @Field(() => String)
  photoPath: string

  @Field(() => String)
  subTitle: string

  @Field(() => String)
  instagram: string

  @Field(() => String)
  facebook: string

  @Field(() => String)
  web: string

  @Field(() => String)
  linkedin: string

  @Authorized([Role.ADMIN])
  @Field()
  createdAt: Date

  @Authorized([Role.ADMIN])
  @Field()
  updatedAt: Date
}
