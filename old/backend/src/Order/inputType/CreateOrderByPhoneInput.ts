import { InputType, Field } from 'type-graphql'

@InputType()
export class CreateOrderByPhoneInput {
  @Field()
  phoneNumber!: string

  @Field()
  merchantStoreId!: string

  @Field({ nullable: true })
  note?: string
}
