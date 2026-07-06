import { ObjectType, Field, Float, Int } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'

@ObjectType()
export class StampCardProgress {
  @Field(() => Boolean)
  hasCard: boolean

  @Field(() => Int, { nullable: true })
  stampsCollected?: number

  @Field(() => Int, { nullable: true })
  stampsRequired?: number

  @Field(() => String, { nullable: true })
  cardId?: string
}

@ObjectType()
export class StampCardStoreWithDistance {
  @Field(() => MerchantStore)
  store: MerchantStore

  @Field(() => Merchant)
  merchant: Merchant

  @Field(() => Float)
  distanceKm: number

  @Field(() => String, { nullable: true })
  stampIconUrl?: string

  @Field(() => StampCardProgress)
  stampCardProgress: StampCardProgress

  @Field(() => Boolean)
  hasStreak: boolean
}
