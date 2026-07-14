import { ObjectType, Field, registerEnumType } from 'type-graphql'
import { Merchant } from '../../Merchant/objectType/Merchant'

export enum TimelineActivityType {
  STAMP_ADDED = 'STAMP_ADDED',
  STAMP_CARD_COMPLETED = 'STAMP_CARD_COMPLETED',
  STAMP_CARD_ACTIVATED = 'STAMP_CARD_ACTIVATED',
  POINTS_EARNED = 'POINTS_EARNED',
  POINTS_SPENT = 'POINTS_SPENT',
  COUPON_CLAIMED = 'COUPON_CLAIMED',
  COUPON_USED = 'COUPON_USED',
  VOUCHER_PURCHASED = 'VOUCHER_PURCHASED',
  VOUCHER_USED = 'VOUCHER_USED',
}

export enum TransactionDirection {
  INCOMING = 'INCOMING', // ▲ Trójkąt w górę
  OUTGOING = 'OUTGOING', // ▼ Trójkąt w dół
}

registerEnumType(TimelineActivityType, { name: 'TimelineActivityType' })
registerEnumType(TransactionDirection, { name: 'TransactionDirection' })

@ObjectType()
export class ActivityTimeline {
  @Field()
  id!: string

  @Field(() => TimelineActivityType)
  type!: TimelineActivityType

  @Field(() => TransactionDirection)
  direction!: TransactionDirection

  @Field()
  title!: string

  @Field({ nullable: true })
  description?: string

  @Field()
  createdAt!: Date

  @Field()
  timeAgoMinutes!: number // Liczba minut temu (FE formatuje)

  @Field({ nullable: true })
  iconUrl?: string // URL ikony (pieczątka, logo punktów)

  @Field({ nullable: true })
  merchantName?: string

  @Field({ nullable: true })
  storeName?: string

  @Field({ nullable: true })
  amount?: number // Liczba punktów lub pieczątek

  @Field({ nullable: true })
  pointsAmount?: number // Liczba punktów (dla transakcji punktowych)

  @Field({ nullable: true })
  stampsAmount?: number // Liczba pieczątek

  @Field(() => Merchant, { nullable: true })
  merchant?: Merchant
}
