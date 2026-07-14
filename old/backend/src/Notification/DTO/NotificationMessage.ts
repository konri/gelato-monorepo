import { Field, InputType } from 'type-graphql'

@InputType()
export class NotificationMessage {
  @Field(() => String)
  title: string

  @Field(() => String)
  text: string

  @Field(() => String, { nullable: true })
  image?: string

  @Field(() => String, { nullable: true })
  additionalParams?: string

  @Field(() => [String])
  usersId: Array<string>
}
