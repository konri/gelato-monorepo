import { Field, InputType, Int } from 'type-graphql'

@InputType()
export class EnterpriseFormInput {
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
