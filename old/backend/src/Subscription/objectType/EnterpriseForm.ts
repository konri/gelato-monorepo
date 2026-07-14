import { Field, Float, ID, Int, ObjectType } from 'type-graphql'
import { User } from '../../User/objectType/User'

@ObjectType()
export class EnterpriseForm {
  @Field(() => ID)
  id: number
  @Field(() => User)
  user?: User
  @Field(() => String)
  name: string
  @Field(() => String)
  surname: string
  @Field(() => String)
  company: string
  @Field(() => String)
  email: string
  @Field(() => String)
  mobile: string
  @Field(() => Int)
  amountProjects: number
  @Field(() => Int)
  amountUsers: number
  @Field(() => String)
  message: string
}
