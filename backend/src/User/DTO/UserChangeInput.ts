import { Field, InputType } from 'type-graphql'
import { LanguageCode } from '../../shared/interface/LanguageCode'

@InputType()
export class UserChangeInput {
  @Field(() => String, { nullable: true })
  name?: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  surname?: string

  @Field(() => String, { nullable: true })
  phone?: string

  @Field(() => Date, { nullable: true })
  birthDate?: Date

  @Field(() => String, { nullable: true })
  picture?: string

  @Field(() => String, { nullable: true })
  referralCode?: string
}
