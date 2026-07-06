import 'reflect-metadata'
import { InputType, Field } from 'type-graphql'
import { VoucherType } from '../objectType/PointVoucher'

@InputType()
export class CreatePointVoucherInput {
  @Field()
  code: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field(() => VoucherType, { defaultValue: VoucherType.SINGLE_SERVICE })
  voucherType: VoucherType

  @Field()
  pointsCost: number

  @Field({ defaultValue: 1 })
  maxUses: number

  @Field({ nullable: true })
  validFrom?: Date

  @Field({ nullable: true })
  validUntil?: Date

  @Field(() => String, { nullable: true })
  metadata?: string
}
