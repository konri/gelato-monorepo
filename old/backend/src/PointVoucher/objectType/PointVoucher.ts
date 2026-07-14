import 'reflect-metadata'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'
import { UserPointVoucher } from './UserPointVoucher'

export enum VoucherType {
  SINGLE_SERVICE = 'SINGLE_SERVICE',
  MULTI_USE = 'MULTI_USE',
  SERVICE_PACKAGE = 'SERVICE_PACKAGE',
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  CASH_EQUIVALENT = 'CASH_EQUIVALENT',
}

registerEnumType(VoucherType, {
  name: 'VoucherType',
  description: 'Typ vouchera punktowego',
})

@ObjectType()
export class PointVoucher {
  @Field(() => ID)
  id: string

  @Field()
  code: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field(() => VoucherType)
  voucherType: VoucherType

  @Field()
  pointsCost: number

  @Field()
  maxUses: number

  @Field()
  currentUses: number

  @Field()
  isActive: boolean

  @Field({ nullable: true })
  validFrom?: Date

  @Field({ nullable: true })
  validUntil?: Date

  @Field(() => String, { nullable: true })
  metadata?: string

  @Field(() => [UserPointVoucher])
  userPointVouchers: UserPointVoucher[]

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
