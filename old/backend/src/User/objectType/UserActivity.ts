import 'reflect-metadata'
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'

export enum ActivityType {
  STAMP_CARD = 'STAMP_CARD',
  COUPON = 'COUPON',
  POINT_VOUCHER = 'POINT_VOUCHER',
}

export enum ActivityStatus {
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
}

registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'Type of user activity',
})

registerEnumType(ActivityStatus, {
  name: 'ActivityStatus',
  description: 'Status of user activity',
})

@ObjectType()
export class UserActivity {
  @Field(() => ID)
  id: string

  @Field(() => ActivityType)
  type: ActivityType

  @Field(() => ActivityStatus)
  status: ActivityStatus

  @Field(() => String)
  title: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Merchant)
  merchant: Merchant

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  validUntil?: Date

  @Field(() => Date, { nullable: true })
  usedAt?: Date

  // Stamp card specific fields
  @Field(() => Number, { nullable: true })
  stampsCollected?: number

  @Field(() => Number, { nullable: true })
  stampsRequired?: number

  // Coupon specific fields
  @Field(() => String, { nullable: true })
  discountType?: string

  @Field(() => Number, { nullable: true })
  discountValue?: number

  // Point voucher specific fields
  @Field(() => String, { nullable: true })
  qrCode?: string

  @Field(() => Number, { nullable: true })
  pointsCost?: number
}
