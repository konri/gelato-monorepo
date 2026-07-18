import { ObjectType, Field, ID } from 'type-graphql';

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

  @Field()
  isRead!: boolean;

  @Field()
  createdAt!: Date;
}
