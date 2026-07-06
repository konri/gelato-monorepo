import { Resolver, Query, Arg, Ctx, Float } from 'type-graphql';
import { DiscountType } from '@prisma/client';
import { Context } from '../types/Context';
import { PromoValidation } from '../types/PromoCodeType';

/**
 * Compute the PLN discount for a promo code against a subtotal.
 * Exported so createOrder (Phase 4) can reuse the exact same math.
 */
export const computeDiscount = (
  promo: { discountType: DiscountType; value: number; maxDiscount: number | null },
  subtotal: number,
): number => {
  let amount =
    promo.discountType === DiscountType.PERCENTAGE
      ? (subtotal * promo.value) / 100
      : promo.value;
  if (promo.maxDiscount != null) amount = Math.min(amount, promo.maxDiscount);
  // Never discount more than the subtotal.
  return Math.round(Math.min(amount, subtotal) * 100) / 100;
};

@Resolver()
export class PromoCodeResolver {
  /**
   * Validate a promo/influencer code against an order subtotal (public).
   * Returns valid=false with a reason instead of throwing, so the UI can
   * show inline feedback.
   */
  @Query(() => PromoValidation)
  async validatePromoCode(
    @Arg('code') code: string,
    @Arg('subtotal', () => Float) subtotal: number,
    @Ctx() { prisma }: Context
  ): Promise<PromoValidation> {
    const normalized = code.trim().toUpperCase();
    const fail = (reason: string): PromoValidation => ({
      valid: false,
      code: normalized,
      discountAmount: 0,
      isInfluencer: false,
      reason,
    });

    if (!normalized) return fail('empty');

    const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
    if (!promo || !promo.isActive) return fail('not_found');

    const now = new Date();
    if (promo.validFrom && promo.validFrom > now) return fail('not_yet_valid');
    if (promo.validUntil && promo.validUntil < now) return fail('expired');
    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
      return fail('usage_limit');
    }
    if (promo.minOrderValue != null && subtotal < promo.minOrderValue) {
      return fail('min_order');
    }

    const discountAmount = computeDiscount(promo, subtotal);
    if (discountAmount <= 0) return fail('no_discount');

    return {
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      value: promo.value,
      discountAmount,
      isInfluencer: promo.isInfluencer,
    };
  }
}
