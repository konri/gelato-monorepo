import { ObjectType, Field, ID, Int, InputType } from 'type-graphql';

/**
 * Lightweight authoring-spot info attached to a news item.
 */
@ObjectType()
export class NewsSpotType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field(() => ID, { nullable: true })
  cityId?: string;
}

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

  // Authoring spot (null for global/admin-authored news). Resolved lazily.
  @Field(() => ID, { nullable: true })
  spotId?: string;

  @Field(() => NewsSpotType, { nullable: true })
  spot?: NewsSpotType;

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

  // The comment this one replies to (null = top-level comment).
  @Field(() => ID, { nullable: true })
  parentId?: string;

  // When set, this is an official reply posted as the spot.
  @Field(() => ID, { nullable: true })
  asSpotId?: string;

  @Field()
  content!: string;

  // Display name: the spot's name for official spot replies, else the user's.
  @Field({ nullable: true })
  userName?: string;

  // Avatar: the spot's logo for official spot replies, else the user's picture.
  @Field({ nullable: true })
  userAvatar?: string;

  // True when the comment is an official spot reply (for a badge in the UI).
  @Field()
  isSpotReply!: boolean;

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

/**
 * Create-news input for a spot admin publishing from the spot app. Simpler
 * than the global admin form: one title/description (optionally localized),
 * optional images already uploaded, and the authoring spot. Targeting is
 * derived from the spot's city, so no city picker is needed.
 */
@InputType()
export class CreateSpotNewsInput {
  @Field(() => ID)
  spotId!: string;

  @Field()
  title!: string;

  @Field()
  description!: string;

  // Optional localized blobs (JSON strings). If omitted, title/description
  // are used for all languages.
  @Field({ nullable: true })
  titleLocal?: string;

  @Field({ nullable: true })
  descriptionLocal?: string;

  @Field(() => [String], { defaultValue: [] })
  images!: string[];
}
