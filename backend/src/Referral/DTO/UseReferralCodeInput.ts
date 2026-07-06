import 'reflect-metadata'
import { Field, InputType } from 'type-graphql'

@InputType()
export class UseReferralCodeInput {
  @Field(() => String)
  referralCode: string
}
