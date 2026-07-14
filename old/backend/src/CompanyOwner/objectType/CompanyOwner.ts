import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { User } from '../../User/objectType/User'
import { Company } from './Comapny'

@ObjectType()
export class CompanyOwner {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Field(() => Company)
  company: Company

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}
