import { ObjectType, Field, ID, Float, Int, registerEnumType } from 'type-graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { ProductType as PrismaProductType } from '@prisma/client';

// Register the Prisma enum with TypeGraphQL (shared name across the schema)
registerEnumType(PrismaProductType, {
  name: 'ProductType',
  description: 'Product category (COFFEE, BEVERAGE, DESSERT, MERCHANDISE, OTHER, TASTE)',
});

/**
 * Product (non-taste spot item, e.g. coffee) GraphQL Type
 */
@ObjectType('Product')
export class ProductGraphQLType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  spotId!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLJSON)
  nameLocal!: any; // { pl, en, ua }

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  descriptionLocal?: any;

  @Field(() => PrismaProductType)
  type!: PrismaProductType;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => Float)
  price!: number;

  @Field(() => Int)
  loyaltyPoints!: number;

  @Field()
  isBox!: boolean;

  @Field(() => Int, { nullable: true })
  maxTastes?: number;

  @Field(() => Int, { nullable: true })
  weightGrams?: number;

  @Field(() => Float, { nullable: true })
  kcalPerPortion?: number;

  @Field(() => Float, { nullable: true })
  kcalPer100g?: number;

  @Field(() => [String])
  allergens!: string[];

  @Field()
  isAvailable!: boolean;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
