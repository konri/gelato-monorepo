import { gql } from '@apollo/client';
import { executeGraphQLQuery, GraphQLOptions } from '../../client';
import { USER_PRIZE_FIELDS } from '../../queries/prizes/query';
import type { UserPrize } from '../../queries/prizes/types';
import { GraphQLResult } from '../../types';

/**
 * Claim a reward with the points of its brand (BRANDS_SPEC §5.5). The same
 * `requestId` on a retry returns the original claim instead of a second one.
 */
export const REDEEM_PRIZE_MUTATION = gql`
  mutation RedeemPrize($prizeId: ID!, $requestId: String) {
    redeemPrize(prizeId: $prizeId, requestId: $requestId) {
      ...UserPrizeFields
    }
  }
  ${USER_PRIZE_FIELDS}
`;

/** Codes the claim screen explains itself (no generic error toast). */
export const REDEEM_PRIZE_ERROR_CODES = [
  'INSUFFICIENT_POINTS',
  'REWARD_UNAVAILABLE',
  'BRAND_INACTIVE',
  'IDEMPOTENCY_CONFLICT',
] as const;

export const redeemPrize = async (
  prizeId: string,
  requestId: string,
  options: Omit<GraphQLOptions, 'variables'> = {},
): Promise<GraphQLResult<UserPrize>> => {
  const res = await executeGraphQLQuery<{ redeemPrize: UserPrize }>(REDEEM_PRIZE_MUTATION, {
    silentCodes: REDEEM_PRIZE_ERROR_CODES,
    ...options,
    variables: { prizeId, requestId },
  });
  return { ...res, data: res.data ? res.data.redeemPrize : null };
};
