import { ObjectType, Field, ID, Int } from 'type-graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class PrizeType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => GraphQLJSON)
  titleLocal!: any;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  descriptionLocal?: any;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => Int)
  pointsCost!: number;

  @Field(() => Int, { nullable: true })
  quantity?: number;

  @Field(() => Int)
  claimed!: number;

  @Field()
  isActive!: boolean;

  @Field({ nullable: true })
  validFrom?: Date;

  @Field({ nullable: true })
  validUntil?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class UserPrizeType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  prizeId!: string;

  @Field(() => PrizeType)
  prize!: PrizeType;

  @Field()
  qrCode!: string;

  @Field()
  isRedeemed!: boolean;

  @Field({ nullable: true })
  redeemedAt?: Date;

  @Field()
  claimedAt!: Date;

  @Field()
  validUntil!: Date;
}
