import { Field, InputType, Int, Float } from 'type-graphql'
import { AvailabilityType, CouponType, DiscountType, VoucherDisplayType } from '../objectType/CouponType'

@InputType()
export class UpsertCouponStoreOverrideInput {
  @Field({ nullable: true })
  title?: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  shortDescription?: string

  @Field({ nullable: true })
  termsAndConditions?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field(() => CouponType, { nullable: true })
  couponType?: CouponType

  @Field(() => AvailabilityType, { nullable: true })
  availability?: AvailabilityType

  @Field(() => VoucherDisplayType, { nullable: true })
  displayType?: VoucherDisplayType

  @Field(() => Int, { nullable: true })
  pointsCost?: number

  @Field(() => Int, { nullable: true })
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

  @Field(() => Int, { nullable: true })
  buyQuantity?: number

  @Field(() => Int, { nullable: true })
  getQuantity?: number

  @Field(() => DiscountType, { nullable: true })
  discountType?: DiscountType

  @Field(() => Float, { nullable: true })
  discountValue?: number

  @Field({ nullable: true })
  dayOfWeek?: string

  @Field(() => Float, { nullable: true })
  thresholdAmount?: number

  @Field(() => Float, { nullable: true })
  discountAmount?: number

  @Field({ nullable: true })
  itemName?: string

  @Field({ nullable: true })
  itemBarcode?: string

  @Field(() => Int, { nullable: true })
  daysBeforeBirthday?: number

  @Field(() => Int, { nullable: true })
  daysAfterBirthday?: number

  @Field({ nullable: true })
  activityType?: string

  @Field({ nullable: true })
  isActive?: boolean

  @Field(() => Int, { nullable: true })
  usesPerUserLimit?: number

  @Field(() => Int, { nullable: true })
  globalUsageLimit?: number

  @Field({ nullable: true })
  isStackable?: boolean
}
