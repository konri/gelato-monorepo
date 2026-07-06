import { gql } from '@apollo/client';
import { executeGraphQLQuery } from '../../client';
import { UnifiedSearchOptions, UnifiedSearchResponse } from './types';

const UNIFIED_SEARCH_FULL_QUERY = gql`
  query UnifiedSearch($filters: UnifiedSearchInput!) {
    unifiedSearch(filters: $filters) {
      coupons {
        coupon {
          id
          code
          title
          description
          imageUrl
          displayType
          priority
          couponType
          pointsCost
          validFrom
          validUntil
          discountType
          discountValue
        }
        merchant {
          id
          name
          slug
          logoUrl
        }
        distanceKm
      }
      stores {
        store {
          id
          name
          address
          city
          latitude
          longitude
          images {
            url
            type
            alt
          }
          category {
            iconPngUrl
            name
          }
        }
        merchant {
          id
          name
          logoUrl
        }
        distanceKm
        isFavorite
        favoriteIconUrl
        favoriteIconPngUrl
        hasStreak
        streakIconPngUrl
      }
      stampCardStores {
        store {
          id
          name
          address
          city
          images {
            url
            type
            alt
          }
          logoUrl
        }
        merchant {
          id
          name
          logoUrl
          coverUrl
        }
        distanceKm
        stampIconUrl
        hasStreak
        stampCardProgress {
          hasCard
          stampsCollected
          stampsRequired
          cardId
        }
      }
      streakStores {
        store {
          id
          name
          address
          city
          images {
            url
            type
            alt
          }
        }
        merchant {
          id
          name
          logoUrl
        }
        distanceKm
        streak {
          streakProgramId
          programName
          currentStreak
          requiredConsecutiveDays
          claimableRewardsCount
          streakingPolicy
        }
      }
      metadata {
        totalResults
        filteredResults
      }
    }
  }
`;

export const unifiedSearch = async (options: UnifiedSearchOptions) => {
  const { input, token, ...apolloOptions } = options;

  const result = await executeGraphQLQuery<UnifiedSearchResponse>(UNIFIED_SEARCH_FULL_QUERY, {
    ...apolloOptions,
    token,
    variables: { filters: input },
  });

  return {
    ...result,
    data: result.data ? result.data.unifiedSearch : null,
  };
};
