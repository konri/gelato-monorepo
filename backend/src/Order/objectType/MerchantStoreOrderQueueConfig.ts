import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class MerchantStoreOrderQueueConfig {
  @Field(() => Int)
  orderArchiveDelayMs: number

  @Field(() => Int)
  maxActiveOrders: number

  @Field(() => Int)
  webSessionTtlMs: number

  @Field(() => String, { nullable: true })
  orderReadyPushTitle?: string | null

  @Field(() => String, { nullable: true })
  orderReadyPushBody?: string | null

  @Field(() => Int)
  orderNumberRolloverAfter: number

  @Field()
  autoPickUpAfterReady: boolean

  @Field()
  orderReadyReminderEnabled: boolean

  @Field(() => Int)
  orderReadyReminderDelayMs: number

  @Field()
  requirePickupCode: boolean
}
