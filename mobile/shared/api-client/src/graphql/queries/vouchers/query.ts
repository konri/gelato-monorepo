import { gql } from '@apollo/client';

export const GET_PROMOTED_VOUCHERS_BY_LOCATION_QUERY = gql`
  query GetPromotedVouchersByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!, $displayType: VoucherDisplayType) {
    promotedVouchers(location: { latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm }, displayType: $displayType) {
      id
      title
      description
      value
      pointsCost
      imageUrl
      priority
      validFrom
      validUntil
      displayType
      merchant {
        id
        name
        slug
        logoUrl
      }
      store {
        id
        name
        address
        city
        latitude
        longitude
        logoUrl
      }
    }
  }
`;

export const GET_PROMOTED_VOUCHERS_BY_CITY_QUERY = gql`
  query GetPromotedVouchersByCity($cityName: String!, $radiusKm: Float!, $displayType: VoucherDisplayType) {
    promotedVouchers(cityName: $cityName, radiusKm: $radiusKm, displayType: $displayType) {
      id
      title
      description
      value
      pointsCost
      imageUrl
      priority
      validFrom
      validUntil
      displayType
      merchant {
        id
        name
        slug
        logoUrl
      }
      store {
        id
        name
        address
        city
        latitude
        longitude
        logoUrl
      }
    }
  }
`;
