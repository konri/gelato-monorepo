import { gql } from '@apollo/client';
import { executeGraphQLQuery } from '../../client';
import { ApolloServerConfig, GraphQLResult } from '../../types';

export const REDEEM_PRIZE_MUTATION = gql`
  mutation RedeemPrize($prizeId: ID!) {
    redeemPrize(prizeId: $prizeId) {
      id
      qrCode
      validUntil
      prize {
        id
        title
        pointsCost
      }
    }
  }
`;

export type RedeemedPrize = {
  id: string;
  qrCode: string;
  validUntil: string;
  prize: { id: string; title: string; pointsCost: number };
};

export const redeemPrize = async (
  prizeId: string,
  options: ApolloServerConfig = {},
): Promise<GraphQLResult<RedeemedPrize>> => {
  const res = await executeGraphQLQuery<{ redeemPrize: RedeemedPrize }>(REDEEM_PRIZE_MUTATION, {
    ...options,
    variables: { prizeId },
  });
  return { ...res, data: res.data ? res.data.redeemPrize : null };
};
