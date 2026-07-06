import { ObjectType, Field } from 'type-graphql'
import { StoreWithDistance, CouponWithDistance } from './LocationResult'
import { StampCardStoreWithDistance } from './StampCardStoreWithDistance'
import { StreakStoreWithDistance } from './StreakStoreWithDistance'
import { FilterMetadata } from '../../shared/objectTypes/FilterMetadata'

@ObjectType()
export class UnifiedSearchResult {
  @Field(() => [StoreWithDistance], { nullable: true })
  stores?: StoreWithDistance[]

  @Field(() => [CouponWithDistance], { nullable: true })
  coupons?: CouponWithDistance[]

  @Field(() => [StampCardStoreWithDistance], { nullable: true })
  stampCardStores?: StampCardStoreWithDistance[]

  @Field(() => [StreakStoreWithDistance], { nullable: true })
  streakStores?: StreakStoreWithDistance[]

  @Field(() => FilterMetadata)
  metadata: FilterMetadata

  @Field(() => Number, { nullable: true })
  searchLatitude?: number

  @Field(() => Number, { nullable: true })
  searchLongitude?: number
}
