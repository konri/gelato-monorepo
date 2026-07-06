import { ObjectType, Field, ID, Int } from 'type-graphql';

/**
 * A client's review of a completed order (rates spot, courier, and overall
 * experience). Created ~1 hour after delivery.
 */
@ObjectType()
export class ReviewType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => ID)
  spotId!: string;

  @Field(() => Int)
  spotRating!: number;

  @Field(() => Int, { nullable: true })
  courierRating?: number;

  @Field(() => Int)
  overallRating!: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  createdAt!: Date;
}

/**
 * A delivered order that is awaiting the client's review (the +1h prompt).
 */
@ObjectType()
export class PendingReviewType {
  @Field(() => ID)
  orderId!: string;

  @Field()
  orderNumber!: string;

  @Field(() => ID)
  spotId!: string;

  @Field()
  spotName!: string;

  @Field({ nullable: true })
  spotLogoUrl?: string;

  @Field({ nullable: true })
  hasCourier?: boolean;

  @Field()
  deliveredAt!: Date;
}
