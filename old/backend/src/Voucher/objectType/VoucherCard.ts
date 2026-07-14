import { Field, Float, ID, Int, ObjectType } from 'type-graphql'
import { VoucherCardType } from './VoucherCardType'
import { LanguageCode } from '../../shared/interface/LanguageCode'

@ObjectType('VoucherCard')
export class VoucherCard {
  @Field(() => ID)
  id: number

  @Field(() => VoucherCardType)
  type: VoucherCardType

  @Field(() => String)
  title: string

  @Field(() => String)
  desc: string

  @Field(() => Boolean)
  mostPopular: boolean

  @Field(() => Float)
  prize: number

  @Field(() => String)
  currency: string

  @Field(() => Int)
  amountMonth: number

  @Field(() => LanguageCode)
  language: LanguageCode

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
