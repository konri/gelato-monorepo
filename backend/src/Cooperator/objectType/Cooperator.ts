import { ObjectType, Field, ID, Authorized } from 'type-graphql'
import { Role } from '../../User/objectType/Role'
import { User } from '../../User/objectType/User'
import { Company } from '../../CompanyOwner/objectType/Comapny'
import { CooperatorType } from './CooperatorType'

@ObjectType()
export class Cooperator {
  @Field(() => ID)
  id: string

  @Field(() => User)
  user: User

  @Authorized([Role.ADMIN, Role.COOPERATOR])
  @Field(() => [Company])
  companies: Company[]

  @Field(() => CooperatorType, { nullable: true })
  type: CooperatorType

  // @Field(() => [Projects])
  // projects: Projects[]

  @Field()
  createdAt: Date

  @Authorized(Role.ADMIN)
  @Field()
  updatedAt: Date
}
