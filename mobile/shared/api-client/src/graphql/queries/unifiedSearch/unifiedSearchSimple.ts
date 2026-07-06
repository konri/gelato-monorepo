import { gql } from '@apollo/client';
import { executeGraphQLQuery } from '../../client';
import { UnifiedSearchOptions, UnifiedSearchResponse } from './types';

const UNIFIED_SEARCH_SIMPLE_QUERY = gql`
  query UnifiedSearchSimple($filters: UnifiedSearchInput!) {
    unifiedSearch(filters: $filters) {
      coupons {
        coupon {
          id
          title
          description
          pointsCost
          displayType
          imageUrl
        }
        merchant {
          id
          name
          logoUrl
        }
        distanceKm
      }
      metadata {
        totalResults
        filteredResults
      }
    }
  }
`;

export const unifiedSearchSimple = async (options: UnifiedSearchOptions) => {
  const { input, token, ...apolloOptions } = options;

  const result = await executeGraphQLQuery<UnifiedSearchResponse>(UNIFIED_SEARCH_SIMPLE_QUERY, {
    ...apolloOptions,
    token,
    variables: { filters: input },
  });

  return {
    ...result,
    data: result.data ? result.data.unifiedSearch : null,
  };
};
