import { ObjectType, Field, ID, Int, InputType } from 'type-graphql';

/**
 * News GraphQL Type
 */
@ObjectType()
export class NewsType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => String)
  titleLocal!: any; // JSON { pl, en, ua }

  @Field()
  description!: string;

  @Field(() => String)
  descriptionLocal!: any; // JSON { pl, en, ua }

  @Field(() => [String])
  images!: string[];

  @Field(() => [String])
  targetCityIds!: string[];

  @Field()
  isPublished!: boolean;

  @Field({ nullable: true })
  publishedAt?: Date;

  @Field(() => Int)
  likesCount!: number;

  @Field(() => Int)
  commentsCount!: number;

  // Whether the current user has liked this item (false if not logged in).
  @Field()
  isLiked!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * News Comment GraphQL Type
 */
@ObjectType()
export class NewsCommentType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  newsId!: string;

  @Field()
  content!: string;

  // Display name of the commenter (resolved from the user).
  @Field({ nullable: true })
  userName?: string;

  // Commenter's profile picture URL (resolved from the user).
  @Field({ nullable: true })
  userAvatar?: string;

  @Field()
  createdAt!: Date;
}

/**
 * Create News Input
 */
@InputType()
export class CreateNewsInput {
  @Field()
  title!: string;

  @Field()
  titleLocal!: string; // JSON string

  @Field()
  description!: string;

  @Field()
  descriptionLocal!: string; // JSON string

  @Field(() => [String], { defaultValue: [] })
  targetCityIds!: string[];
}

/**
 * Update News Input
 */
@InputType()
export class UpdateNewsInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  titleLocal?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  descriptionLocal?: string;

  @Field(() => [String], { nullable: true })
  images?: string[];

  @Field(() => [String], { nullable: true })
  targetCityIds?: string[];

  @Field(() => Boolean, { nullable: true })
  isPublished?: boolean;
}
