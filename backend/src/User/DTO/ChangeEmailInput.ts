import { Field, InputType } from 'type-graphql'

@InputType()
export class ChangeEmailInput {
  @Field(() => String)
  newEmail: string
}
