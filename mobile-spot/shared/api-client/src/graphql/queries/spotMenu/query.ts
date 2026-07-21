import { gql } from '@apollo/client';

export const SPOT_TASTES_QUERY = gql`
  query SpotTastesManage($spotId: ID!) {
    spotTastes(spotId: $spotId, includeUnavailable: true) {
      id
      spotId
      title
      subtitle
      description
      type
      imageUrl
      price
      loyaltyPoints
      ingredients
      allergens
      kcalPerPortion
      kcalPer100g
      isAvailable
    }
  }
`;

export const SPOT_PRODUCTS_QUERY = gql`
  query SpotProductsManage($spotId: ID!) {
    spotProducts(spotId: $spotId, includeUnavailable: true) {
      id
      spotId
      name
      description
      type
      imageUrl
      price
      loyaltyPoints
      isBox
      maxTastes
      weightGrams
      allergens
      kcalPerPortion
      kcalPer100g
      isAvailable
    }
  }
`;

/* ------------------------------ Tastes ------------------------------ */

export const CREATE_TASTE_MUTATION = gql`
  mutation CreateTaste(
    $spotId: ID!
    $title: String!
    $titleLocal: String!
    $type: TasteType!
    $description: String
    $imageUrl: String
    $kcalPerPortion: Float
    $kcalPer100g: Float
    $allergens: [String!]
    $loyaltyPoints: Int
  ) {
    createTaste(
      spotId: $spotId
      title: $title
      titleLocal: $titleLocal
      type: $type
      description: $description
      imageUrl: $imageUrl
      kcalPerPortion: $kcalPerPortion
      kcalPer100g: $kcalPer100g
      allergens: $allergens
      loyaltyPoints: $loyaltyPoints
    ) {
      id
    }
  }
`;

export const UPDATE_TASTE_MUTATION = gql`
  mutation UpdateTaste(
    $id: ID!
    $title: String
    $titleLocal: String
    $type: TasteType
    $description: String
    $ingredients: String
    $price: Float
    $kcalPerPortion: Float
    $kcalPer100g: Float
    $allergens: [String!]
    $loyaltyPoints: Int
  ) {
    updateTaste(
      id: $id
      title: $title
      titleLocal: $titleLocal
      type: $type
      description: $description
      ingredients: $ingredients
      price: $price
      kcalPerPortion: $kcalPerPortion
      kcalPer100g: $kcalPer100g
      allergens: $allergens
      loyaltyPoints: $loyaltyPoints
    ) {
      id
    }
  }
`;

export const UPDATE_TASTE_AVAILABILITY_MUTATION = gql`
  mutation UpdateTasteAvailability($id: ID!, $isAvailable: Boolean!) {
    updateTasteAvailability(id: $id, isAvailable: $isAvailable)
  }
`;

export const DELETE_TASTE_MUTATION = gql`
  mutation DeleteTaste($id: ID!) {
    deleteTaste(id: $id)
  }
`;

/* ----------------------------- Products ----------------------------- */

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct(
    $spotId: ID!
    $name: String!
    $nameLocal: String!
    $type: ProductType!
    $price: Float!
    $description: String
    $imageUrl: String
    $isBox: Boolean
    $maxTastes: Int
    $weightGrams: Int
    $kcalPerPortion: Float
    $kcalPer100g: Float
    $allergens: [String!]
    $loyaltyPoints: Int
  ) {
    createProduct(
      spotId: $spotId
      name: $name
      nameLocal: $nameLocal
      type: $type
      price: $price
      description: $description
      imageUrl: $imageUrl
      isBox: $isBox
      maxTastes: $maxTastes
      weightGrams: $weightGrams
      kcalPerPortion: $kcalPerPortion
      kcalPer100g: $kcalPer100g
      allergens: $allergens
      loyaltyPoints: $loyaltyPoints
    ) {
      id
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct(
    $id: ID!
    $name: String
    $nameLocal: String
    $type: ProductType
    $price: Float
    $description: String
    $maxTastes: Int
    $weightGrams: Int
    $kcalPerPortion: Float
    $kcalPer100g: Float
    $allergens: [String!]
    $loyaltyPoints: Int
  ) {
    updateProduct(
      id: $id
      name: $name
      nameLocal: $nameLocal
      type: $type
      price: $price
      description: $description
      maxTastes: $maxTastes
      weightGrams: $weightGrams
      kcalPerPortion: $kcalPerPortion
      kcalPer100g: $kcalPer100g
      allergens: $allergens
      loyaltyPoints: $loyaltyPoints
    ) {
      id
    }
  }
`;

export const UPDATE_PRODUCT_AVAILABILITY_MUTATION = gql`
  mutation UpdateProductAvailability($id: ID!, $isAvailable: Boolean!) {
    updateProductAvailability(id: $id, isAvailable: $isAvailable)
  }
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;
