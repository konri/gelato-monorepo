import type { DocumentNode } from '@apollo/client';
import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';
import {
  AWARD_LOYALTY_POINTS_MUTATION,
  BRAND_PRIZES_QUERY,
  BRAND_PROMOTIONS_QUERY,
  EXCHANGE_REWARD_AT_COUNTER_MUTATION,
  HAND_OVER_REWARD_MUTATION,
  PICKUP_ORDERS_ELSEWHERE_QUERY,
  STAFF_SCAN_QUERY,
  VALIDATE_PRIZE_QR_MUTATION,
} from './query';
import type {
  AwardLoyaltyPointsInput,
  BrandPromotion,
  BrandReward,
  CounterExchangeResult,
  CustomerReward,
  PickupElsewhere,
  StaffAwardResult,
  StaffScanResult,
} from './types';

export * from './types';

/**
 * Loyalty at the counter (BRANDS_SPEC §4.8, A3): scan, award, hand over,
 * exchange. Every call names the ACTIVE spot; the server derives the brand.
 */

async function run<R, K extends keyof R>(
  document: DocumentNode,
  field: K,
  variables: Record<string, unknown>,
  options: ApolloServerConfig,
): Promise<GraphQLResult<R[K]>> {
  const res = await executeGraphQLQuery<R>(document, { ...options, variables, fetchPolicy: 'network-only' });
  return { ...res, data: res.data ? res.data[field] : null };
}

/** What a scanned or typed code is at the spot. The client only trims; the server parses. */
export const staffScan = (spotId: string, raw: string, options: ApolloServerConfig = {}) =>
  run<{ staffScan: StaffScanResult }, 'staffScan'>(STAFF_SCAN_QUERY, 'staffScan', { spotId, raw }, options);

/** The brand's reward catalog (any staff member of the brand). */
export const getBrandPrizes = (brandId: string | null, options: ApolloServerConfig = {}) =>
  run<{ brandPrizes: BrandReward[] }, 'brandPrizes'>(BRAND_PRIZES_QUERY, 'brandPrizes', { brandId }, options);

/** Running and upcoming promotions at one spot (active now first). */
export const getBrandPromotions = (brandId: string, spotId: string | null, options: ApolloServerConfig = {}) =>
  run<{ brandPromotions: BrandPromotion[] }, 'brandPromotions'>(
    BRAND_PROMOTIONS_QUERY,
    'brandPromotions',
    { brandId, spotId },
    options,
  );

/** Template award (templateId + quantity) or custom award (points). requestId dedupes retries. */
export const awardLoyaltyPoints = (input: AwardLoyaltyPointsInput, options: ApolloServerConfig = {}) =>
  run<{ awardLoyaltyPoints: StaffAwardResult }, 'awardLoyaltyPoints'>(
    AWARD_LOYALTY_POINTS_MUTATION,
    'awardLoyaltyPoints',
    { input },
    options,
  );

/** Hand over a reward claimed in the app, after scanning the owner's card. */
export const handOverReward = (
  spotId: string,
  userPrizeId: string,
  customer: string,
  options: ApolloServerConfig = {},
) =>
  run<{ handOverReward: CustomerReward }, 'handOverReward'>(
    HAND_OVER_REWARD_MUTATION,
    'handOverReward',
    { spotId, userPrizeId, customer },
    options,
  );

/** A3: exchange the customer's points for a reward at the counter (handed over at once). */
export const exchangeRewardAtCounter = (
  vars: { spotId: string; customerId: string; prizeId: string; requestId: string },
  options: ApolloServerConfig = {},
) =>
  run<{ exchangeRewardAtCounter: CounterExchangeResult }, 'exchangeRewardAtCounter'>(
    EXCHANGE_REWARD_AT_COUNTER_MUTATION,
    'exchangeRewardAtCounter',
    vars,
    options,
  );

/** Hand over a reward from its PR code (`normalizedCode` of the scan). */
export const validatePrizeQr = (qrCode: string, spotId: string, options: ApolloServerConfig = {}) =>
  run<{ validatePrizeQR: CustomerReward }, 'validatePrizeQR'>(
    VALIDATE_PRIZE_QR_MUTATION,
    'validatePrizeQR',
    { qrCode, spotId },
    options,
  );

/** The customer's open pickup orders at the brand's other spots. */
export const getPickupOrdersElsewhere = (spotId: string, customer: string, options: ApolloServerConfig = {}) =>
  run<{ pickupOrdersElsewhere: PickupElsewhere[] }, 'pickupOrdersElsewhere'>(
    PICKUP_ORDERS_ELSEWHERE_QUERY,
    'pickupOrdersElsewhere',
    { spotId, customer },
    options,
  );
