import { gql } from '@apollo/client';

export const GET_PROMOTED_COUPONS_BY_LOCATION_QUERY = gql`
  query GetPromotedCouponsByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!, $displayType: String) {
    promotedCoupons(location: { latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm }, displayType: $displayType) {
      id
      code
      title
      distance
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
      merchant {
        id
        name
        slug
        logoUrl
        stores {
          id
          name
          address
          city
          latitude
          longitude
        }
      }
    }
  }
`;

export const GET_PROMOTED_COUPONS_BY_CITY_QUERY = gql`
  query GetPromotedCouponsByCity {
    promotedCoupons {
      id
      code
      title
      description
      displayType
      priority
      couponType
      pointsCost
      merchant {
        name
        stores {
          name
          city
          address
        }
      }
    }
  }
`;

export const GET_PROMOTED_COUPONS_PROMOTED_QUERY = gql`
  query GetPromotedCouponsPromoted {
    promotedCoupons(displayType: "PROMOTED") {
      id
      code
      title
      description
      displayType
      priority
      pointsCost
      merchant {
        name
        stores {
          city
        }
      }
    }
  }
`;