import { Field, InputType } from 'type-graphql'
import { RewardValueType } from '../objectType/Reward'

@InputType()
export class UpsertRewardStoreOverrideInput {
  @Field({ nullable: true })
  title?: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field({ nullable: true })
  isActive?: boolean

  @Field(() => RewardValueType, { nullable: true })
  valueType?: RewardValueType

  @Field({ nullable: true })
  discountPercent?: number

  @Field({ nullable: true })
  discountAmount?: number

  @Field({ nullable: true })
  pointsValue?: number

  @Field({ nullable: true })
  productName?: string

  @Field({ nullable: true })
  maxUsesPerUser?: number

  @Field({ nullable: true })
  totalQuantity?: number

  @Field({ nullable: true })
  validFrom?: Date

  @Field({ nullable: true })
  validUntil?: Date
}
