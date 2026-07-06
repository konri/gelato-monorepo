import { ObjectType, Field, ID } from 'type-graphql';
import { GraphQLJSON } from 'graphql-type-json';

/**
 * City GraphQL Type
 */
@ObjectType('City')
export class CityType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLJSON)
  nameLocal!: any; // JSON object { pl, en, ua }

  @Field()
  country!: string;

  @Field()
  latitude!: number;

  @Field()
  longitude!: number;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
