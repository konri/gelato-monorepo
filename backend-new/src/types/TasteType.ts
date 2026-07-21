import { ObjectType, Field, ID, Float, Int, registerEnumType } from 'type-graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { TasteType as PrismaTasteType } from '@prisma/client';

// Register Prisma enum with TypeGraphQL
registerEnumType(PrismaTasteType, {
  name: 'TasteType',
  description: 'Ice cream flavor type/category',
});

/**
 * Taste (Ice Cream Flavor) GraphQL Type
 * Note: Taste is per-spot in the schema
 */
@ObjectType('Taste')
export class TasteType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  spotId!: string;

  @Field()
  title!: string;

  @Field(() => GraphQLJSON)
  titleLocal!: any; // JSON object {pl, en, ua}

  @Field({ nullable: true })
  subtitle?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  descriptionLocal?: any; // JSON object {pl, en, ua}

  @Field(() => PrismaTasteType)
  type!: PrismaTasteType;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => Float)
  price!: number;

  @Field(() => Int)
  loyaltyPoints!: number;

  @Field(() => Float, { nullable: true })
  kcalPerPortion?: number;

  @Field(() => Float, { nullable: true })
  kcalPer100g?: number;

  @Field(() => Float, { nullable: true })
  portionSizeGrams?: number;

  @Field({ nullable: true })
  ingredients?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  ingredientsLocal?: any; // JSON object

  @Field(() => [String])
  allergens!: string[];

  @Field()
  isAvailable!: boolean;

  @Field()
  isActive!: boolean;

  @Field(() => Int, { defaultValue: 0 })
  likesCount!: number;

  @Field(() => Int, { defaultValue: 0 })
  commentsCount!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
