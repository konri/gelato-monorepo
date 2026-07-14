import { ObjectType, Field, Float, Int, ID } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'

@ObjectType()
export class StreakInfo {
  @Field(() => ID)
  streakProgramId: string

  @Field()
  programName: string

  @Field(() => Int)
  currentStreak: number

  @Field(() => Int)
  requiredConsecutiveDays: number

  @Field(() => Int)
  claimableRewardsCount: number

  @Field()
  streakingPolicy: string
}

@ObjectType()
export class StreakStoreWithDistance {
  @Field(() => MerchantStore)
  store: MerchantStore

  @Field(() => Merchant)
  merchant: Merchant

  @Field(() => Float)
  distanceKm: number

  @Field(() => StreakInfo)
  streak: StreakInfo
}
