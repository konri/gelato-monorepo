import { InputType, Field } from 'type-graphql'
import { RewardSourceType, RewardValueType } from '../objectType/Reward'

@InputType()
export class CreateRewardInput {
  @Field({ nullable: true })
  merchantId?: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  imageUrl?: string

  @Field(() => RewardSourceType)
  sourceType: RewardSourceType

  @Field(() => RewardValueType)
  valueType: RewardValueType

  @Field({ nullable: true })
  discountPercent?: number

  @Field({ nullable: true })
  discountAmount?: number

  @Field({ nullable: true })
  pointsValue?: number

  @Field({ nullable: true })
  cashValue?: number

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

  @Field(() => String, { nullable: true })
  metadata?: string
}
