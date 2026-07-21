import { ObjectType, Field, ID } from 'type-graphql';
import { GraphQLJSON } from 'graphql-type-json';

/**
 * A persisted in-app notification (bell list).
 */
@ObjectType()
export class NotificationType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  body!: string;

  @Field({ nullable: true })
  imageUrl?: string;

  // Category/kind, e.g. "DELIVERY_INCIDENT", "order", "promo", "system".
  @Field()
  type!: string;

  // Arbitrary payload (e.g. { orderId } so the app can deep-link on tap).
  @Field(() => GraphQLJSON, { nullable: true })
  data?: unknown;

  @Field()
  isRead!: boolean;

  @Field()
  createdAt!: Date;
}
