import { ObjectType, Field, ID, Int, registerEnumType } from 'type-graphql';
import { TransactionType } from '@prisma/client';

// Register Prisma enum with TypeGraphQL
registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'Point transaction types',
});

/**
 * Point Balance GraphQL Type
 */
@ObjectType()
export class PointBalanceType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => Int)
  totalPoints!: number;

  @Field(() => Int)
  availablePoints!: number;

  @Field(() => Int)
  lockedPoints!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * Point Transaction GraphQL Type
 */
@ObjectType()
export class PointTransactionType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => TransactionType)
  type!: TransactionType;

  @Field(() => Int)
  amount!: number;

  @Field()
  description!: string;

  @Field({ nullable: true })
  referenceId?: string;

  @Field({ nullable: true })
  referenceType?: string;

  @Field(() => Int)
  balanceBefore!: number;

  @Field(() => Int)
  balanceAfter!: number;

  @Field()
  createdAt!: Date;
}

/**
 * Referral Code GraphQL Type
 */
@ObjectType()
export class ReferralCodeType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  code!: string;

  @Field()
  createdAt!: Date;
}

/**
 * Referral GraphQL Type
 */
@ObjectType()
export class ReferralType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  referrerId!: string;

  @Field(() => ID)
  referredUserId!: string;

  @Field()
  code!: string;

  @Field()
  pointsAwarded!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * Referral Stats GraphQL Type
 */
@ObjectType()
export class ReferralStatsType {
  @Field(() => Int)
  totalReferrals!: number;

  @Field(() => Int)
  completedReferrals!: number;

  @Field(() => Int)
  pendingReferrals!: number;

  @Field(() => Int)
  totalPointsEarned!: number;
}

/**
 * Customer summary shown to spot staff before awarding points, resolved by
 * scanning the loyalty QR or typing the account number.
 */
@ObjectType()
export class LoyaltyCustomerType {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  loyaltyCode?: string;

  @Field({ nullable: true })
  profilePicture?: string;

  @Field(() => Int)
  availablePoints!: number;

  @Field(() => Int)
  totalPoints!: number;

  // Number of active prizes this customer can currently afford.
  @Field(() => Int)
  availablePrizes!: number;
}
