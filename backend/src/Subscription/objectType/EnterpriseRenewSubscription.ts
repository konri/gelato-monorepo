import { Field, Float, ID, Int, ObjectType } from 'type-graphql'
import { User } from '../../User/objectType/User'
import { Company } from '../../CompanyOwner/objectType/Comapny'

@ObjectType()
export class EnterpriseRenewSubscription {
  @Field(() => ID)
  id: number
  @Field(() => User)
  user?: User
  @Field(() => Company)
  company: Company
  @Field(() => String)
  email: string
  @Field(() => String)
  message: string
}
