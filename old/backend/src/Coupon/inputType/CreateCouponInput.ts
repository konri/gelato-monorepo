import { InputType, Field } from 'type-graphql'
import { CouponType, AvailabilityType, DiscountType, VoucherDisplayType } from '../objectType/CouponType'

@InputType()
export class CreateCouponInput {
  @Field()
  code: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  shortDescription?: string

  @Field({ nullable: true })
  termsAndConditions?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field(() => CouponType)
  couponType: CouponType

  @Field(() => AvailabilityType)
  availability: AvailabilityType

  @Field({ nullable: true })
  pointsCost?: number

  @Field(() => VoucherDisplayType, { nullable: true })
  displayType?: VoucherDisplayType

  @Field({ nullable: true })
  priority?: number

  @Field({ nullable: true })
  rewardId?: string

  @Field()
  validFrom: Date

  @Field()
  validUntil: Date

  @Field({ nullable: true })
  assignToUserId?: string

  @Field(() => [String], { nullable: true })
  exclusivityGroups?: string[]

  // Multi-buy fields
  @Field({ nullable: true })
  buyQuantity?: number

  @Field({ nullable: true })
  getQuantity?: number

  // Discount fields (legacy - use rewardId instead)
  @Field(() => DiscountType, { nullable: true })
  discountType?: DiscountType

  @Field({ nullable: true })
  discountValue?: number

  // Day of week fields
  @Field({ nullable: true })
  dayOfWeek?: string

  // Threshold discount fields
  @Field({ nullable: true })
  thresholdAmount?: number

  @Field({ nullable: true })
  discountAmount?: number

  // Item specific fields
  @Field({ nullable: true })
  itemName?: string

  @Field({ nullable: true })
  itemBarcode?: string

  // Birthday fields
  @Field({ nullable: true })
  daysBeforeBirthday?: number

  @Field({ nullable: true })
  daysAfterBirthday?: number

  // Activity fields
  @Field({ nullable: true })
  activityType?: string

  // Enhanced tracking fields
  @Field({ nullable: true })
  usesPerUserLimit?: number

  @Field({ nullable: true })
  globalUsageLimit?: number

  @Field({ nullable: true })
  isStackable?: boolean

  @Field({ nullable: true })
  isActive?: boolean
}
