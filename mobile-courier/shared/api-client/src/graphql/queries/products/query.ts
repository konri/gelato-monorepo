import { gql } from '@apollo/client';

// Non-taste products (coffee, beverages, desserts…) for a spot
export const SPOT_PRODUCTS_QUERY = gql`
  query SpotProducts($spotId: ID!, $includeUnavailable: Boolean) {
    spotProducts(spotId: $spotId, includeUnavailable: $includeUnavailable) {
      id
      spotId
      name
      nameLocal
      description
      descriptionLocal
      type
      imageUrl
      price
      isBox
      maxTastes
      weightGrams
      kcalPerPortion
      allergens
      isAvailable
    }
  }
`;

// Single product detail
export const PRODUCT_DETAIL_QUERY = gql`
  query ProductDetail($id: ID!) {
    product(id: $id) {
      id
      spotId
      name
      nameLocal
      description
      descriptionLocal
      type
      imageUrl
      price
      isBox
      maxTastes
      weightGrams
      kcalPerPortion
      kcalPer100g
      allergens
      isAvailable
    }
  }
`;
