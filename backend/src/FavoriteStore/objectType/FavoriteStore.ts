import { ObjectType, Field, ID } from 'type-graphql'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'

@ObjectType()
export class FavoriteStore {
  @Field(() => ID)
  id: string

  @Field()
  userId: string

  @Field()
  merchantStoreId: string

  @Field(() => MerchantStore)
  merchantStore: MerchantStore

  @Field()
  createdAt: Date
}
