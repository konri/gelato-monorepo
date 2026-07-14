import { ObjectType, Field, ID, Int } from 'type-graphql'
import { MerchantStore } from '../../Merchant/objectType/MerchantStore'

@ObjectType()
export class OrderStatusHistoryEntry {
  @Field()
  status: string

  @Field()
  timestamp: Date
}

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string

  @Field(() => Int)
  orderNumber: number

  @Field()
  status: string

  @Field(() => String, { nullable: true })
  pickupCode?: string | null

  @Field(() => String, { nullable: true })
  userId?: string | null

  @Field(() => String, { nullable: true })
  sessionToken?: string | null

  @Field(() => String, { nullable: true })
  phoneNumber?: string | null

  @Field()
  merchantStoreId: string

  @Field(() => MerchantStore)
  merchantStore?: MerchantStore

  @Field()
  orderDate: Date

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  @Field(() => String, { nullable: true })
  pickedUpSource?: string | null

  @Field(() => Date, { nullable: true })
  pickedUpAt?: Date | null

  @Field(() => Date, { nullable: true })
  readyAt?: Date | null

  @Field(() => String, { nullable: true })
  note?: string | null

  @Field(() => [OrderStatusHistoryEntry], { defaultValue: [] })
  statusHistory: OrderStatusHistoryEntry[]
}
