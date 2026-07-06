import { InputType, Field, ID, Int } from 'type-graphql'

@InputType()
export class UpdateMerchantStoreOrderQueueInput {
  @Field(() => ID)
  merchantStoreId: string

  @Field(() => Int, { nullable: true })
  orderArchiveDelayMs?: number

  @Field(() => Int, { nullable: true })
  maxActiveOrders?: number

  @Field(() => Int, { nullable: true })
  webSessionTtlMs?: number

  @Field(() => String, { nullable: true })
  orderReadyPushTitle?: string | null

  @Field(() => String, { nullable: true })
  orderReadyPushBody?: string | null

  @Field(() => Int, { nullable: true })
  orderNumberRolloverAfter?: number

  @Field({ nullable: true })
  autoPickUpAfterReady?: boolean

  @Field({ nullable: true })
  orderReadyReminderEnabled?: boolean

  @Field(() => Int, { nullable: true })
  orderReadyReminderDelayMs?: number

  @Field({ nullable: true })
  requirePickupCode?: boolean
}
