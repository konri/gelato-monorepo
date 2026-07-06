import { gql } from '@apollo/client';

// Test query without variables to see if endpoint works
export const UNIFIED_SEARCH_TEST_QUERY = gql`
  query UnifiedSearchTest {
    unifiedSearch(filters: {}) {
      metadata {
        totalResults
      }
    }
  }
`;

export const UNIFIED_SEARCH_QUERY = gql`
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
          availability
          pointsCost
          validFrom
          validUntil
          discountType
          discountValue
          buyQuantity
          getQuantity
          thresholdAmount
          discountAmount
          itemName
          dayOfWeek
        }
        merchant {
          id
          name
          slug
          logoUrl
          category {
            id
            name
            slug
          }
        }
        store {
          id
          name
          address
          city
          latitude
          longitude
        }
        distanceKm
      }
      stores {
        store {
          id
          name
          slug
          address
          city
          latitude
          longitude
        }
        merchant {
          id
          name
          slug
          logoUrl
          category {
            id
            name
            slug
          }
        }
        distanceKm
      }
      metadata {
        totalResults
        filteredResults
        hasUserLocation
        availableDisplayTypes
        availableCategories {
          id
          name
          slug
          count
        }
        appliedFilters {
          displayTypes
          sortBy
        }
      }
    }
  }
`;

export const GET_FILTER_OPTIONS_QUERY = gql`
  query GetFilterOptions {
    categories {
      id
      name
      slug
    }
  }
`;
