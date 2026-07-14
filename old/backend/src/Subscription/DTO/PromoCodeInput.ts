import { Field, InputType } from 'type-graphql'

@InputType()
export class PromoCodeInput {
  @Field(() => String)
  code: string

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => String)
  paymentCode: string

  @Field(() => String)
  userName?: string
}
