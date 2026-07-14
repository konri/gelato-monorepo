import { Field, Float, InputType, Int } from 'type-graphql'
import { VoucherCardType } from '../objectType/VoucherCardType'
import { LanguageCode } from '../../shared/interface/LanguageCode'

@InputType()
export class VoucherCardInput {
  @Field(() => VoucherCardType)
  type: VoucherCardType

  @Field(() => String)
  title: string

  @Field(() => Float)
  prize: number

  @Field(() => String)
  currency: string

  @Field(() => String)
  desc: string

  @Field(() => Boolean, { nullable: true })
  mostPopular: boolean

  @Field(() => Int)
  amountMonth: number

  @Field(() => LanguageCode)
  language: LanguageCode
}
