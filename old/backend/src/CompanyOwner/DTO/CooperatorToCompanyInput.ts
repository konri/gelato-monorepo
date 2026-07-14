import { Field, InputType } from 'type-graphql'

@InputType()
export class CooperatorToCompanyInput {
  @Field(() => String)
  cooperatorId: string

  @Field(() => String)
  name: string
}
