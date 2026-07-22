import { ObjectType, Field, ID, Int, Float } from 'type-graphql';

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
 * A publicly-shown review for a spot (client spot page + landing). Carries the
 * reviewer's display name/initial but never their user id or email.
 */
@ObjectType()
export class PublicReviewType {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  rating!: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  authorName!: string;

  @Field()
  createdAt!: Date;
}

/**
 * Aggregate rating for a spot (average + count) for headers/badges.
 */
@ObjectType()
export class SpotRatingSummaryType {
  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Field(() => Int)
  reviewCount!: number;
}

/**
 * A courier-facing review the courier received (their rating + the client's
 * comment). Shown in the courier app's reviews summary.
 */
@ObjectType()
export class CourierReviewType {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  rating!: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  orderNumber!: string;

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
