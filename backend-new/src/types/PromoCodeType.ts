import { ObjectType, Field, ID, Float, registerEnumType } from 'type-graphql';
import { DiscountType as PrismaDiscountType } from '@prisma/client';

registerEnumType(PrismaDiscountType, {
  name: 'DiscountType',
  description: 'How a promo code discount is calculated',
});

/**
 * Result of validating a promo code against a given order subtotal.
 */
@ObjectType()
export class PromoValidation {
  @Field()
  valid!: boolean;

  @Field()
  code!: string;

  @Field(() => PrismaDiscountType, { nullable: true })
  discountType?: PrismaDiscountType;

  @Field(() => Float, { nullable: true })
  value?: number;

  // The actual PLN amount that would be deducted from the given subtotal.
  @Field(() => Float)
  discountAmount!: number;

  @Field()
  isInfluencer!: boolean;

  // Reason when invalid (e.g. "expired", "min_order", "not_found", "usage_limit").
  @Field({ nullable: true })
  reason?: string;
}
