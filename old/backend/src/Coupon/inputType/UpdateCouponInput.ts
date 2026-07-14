import { InputType, Field } from 'type-graphql'
import { CouponType, AvailabilityType, DiscountType, VoucherDisplayType } from '../objectType/CouponType'

@InputType()
export class UpdateCouponInput {
  @Field({ nullable: true })
  title?: string

  @Field({ nullable: true })
  shortDescription?: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  termsAndConditions?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field(() => CouponType, { nullable: true })
  couponType?: CouponType

  @Field(() => AvailabilityType, { nullable: true })
  availability?: AvailabilityType

  @Field({ nullable: true })
  pointsCost?: number

  @Field(() => VoucherDisplayType, { nullable: true })
  displayType?: VoucherDisplayType

  @Field({ nullable: true })
  priority?: number

  @Field({ nullable: true })
  rewardId?: string

  @Field({ nullable: true })
  validFrom?: Date

  @Field({ nullable: true })
  validUntil?: Date

  @Field({ nullable: true })
  assignToUserId?: string

  @Field(() => [String], { nullable: true })
  exclusivityGroups?: string[]

  @Field({ nullable: true })
  buyQuantity?: number

  @Field({ nullable: true })
  getQuantity?: number

  @Field(() => DiscountType, { nullable: true })
  discountType?: DiscountType

  @Field({ nullable: true })
  discountValue?: number

  @Field({ nullable: true })
  dayOfWeek?: string

  @Field({ nullable: true })
  thresholdAmount?: number

  @Field({ nullable: true })
  discountAmount?: number

  @Field({ nullable: true })
  itemName?: string

  @Field({ nullable: true })
  itemBarcode?: string

  @Field({ nullable: true })
  daysBeforeBirthday?: number

  @Field({ nullable: true })
  daysAfterBirthday?: number

  @Field({ nullable: true })
  activityType?: string

  @Field({ nullable: true })
  isActive?: boolean

  @Field({ nullable: true })
  usesPerUserLimit?: number

  @Field({ nullable: true })
  globalUsageLimit?: number

  @Field({ nullable: true })
  isStackable?: boolean
}
