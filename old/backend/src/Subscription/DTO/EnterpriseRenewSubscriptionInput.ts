import { Field, InputType, Int } from 'type-graphql'

@InputType()
export class EnterpriseRenewSubscriptionInput {
  @Field(() => String)
  projectId: string
  @Field(() => String)
  companyId: string
  @Field(() => String)
  email: string
  @Field(() => String)
  message: string
}
