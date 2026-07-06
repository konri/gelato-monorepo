import { gql } from '@apollo/client';

// Active cities (used to resolve the stored city name -> backend city id)
export const CITIES_QUERY = gql`
  query Cities {
    cities {
      id
      name
      nameLocal
      latitude
      longitude
    }
  }
`;

// All active ice cream spots (fallback when no city is selected/resolved)
export const ALL_SPOTS_QUERY = gql`
  query AllSpots {
    spots {
      id
      name
      description
      address
      latitude
      longitude
      logoUrl
      coverUrl
      photos
      deliveryEnabled
      deliveryFee
      freeDeliveryThreshold
      isActive
    }
  }
`;

// Ice cream spots in a given city
export const SPOTS_BY_CITY_QUERY = gql`
  query SpotsByCity($cityId: ID!) {
    spotsByCity(cityId: $cityId) {
      id
      name
      description
      address
      latitude
      longitude
      logoUrl
      coverUrl
      photos
      openingHours
      deliveryEnabled
      deliveryFee
      deliveryRadiusKm
      freeDeliveryThreshold
      hasSeating
      isFavorite
      isActive
    }
  }
`;

// The current user's favorite spots
export const MY_FAVORITE_SPOTS_QUERY = gql`
  query MyFavoriteSpots {
    myFavoriteSpots {
      id
      name
    }
  }
`;

// Toggle a spot as favorite; returns the new favorite state
export const TOGGLE_FAVORITE_SPOT_MUTATION = gql`
  mutation ToggleFavoriteSpot($spotId: ID!) {
    toggleFavoriteSpot(spotId: $spotId)
  }
`;

// Validate a promo / influencer code against an order subtotal
export const VALIDATE_PROMO_QUERY = gql`
  query ValidatePromo($code: String!, $subtotal: Float!) {
    validatePromoCode(code: $code, subtotal: $subtotal) {
      valid
      code
      discountType
      value
      discountAmount
      isInfluencer
      reason
    }
  }
`;

// Whether a spot can deliver to a coordinate (pre-checkout validation)
export const CHECK_DELIVERY_QUERY = gql`
  query CheckDelivery($spotId: ID!, $latitude: Float!, $longitude: Float!) {
    checkDeliveryAvailability(spotId: $spotId, latitude: $latitude, longitude: $longitude) {
      canDeliver
      distanceKm
      deliveryRadiusKm
      deliveryFee
      freeDeliveryThreshold
    }
  }
`;

// Single spot detail
export const SPOT_DETAIL_QUERY = gql`
  query SpotDetail($id: ID!) {
    spot(id: $id) {
      id
      name
      description
      address
      latitude
      longitude
      phone
      email
      logoUrl
      coverUrl
      photos
      openingHours
      deliveryEnabled
      deliveryFee
      freeDeliveryThreshold
      hasSeating
      seatingCapacity
      accessibilityFeatures
      isFavorite
    }
  }
`;

// Tastes (flavors) for a spot
export const SPOT_TASTES_QUERY = gql`
  query SpotTastes($spotId: ID!, $includeUnavailable: Boolean) {
    spotTastes(spotId: $spotId, includeUnavailable: $includeUnavailable) {
      id
      spotId
      title
      titleLocal
      subtitle
      description
      type
      imageUrl
      price
      kcalPerPortion
      allergens
      isAvailable
    }
  }
`;

// Single taste detail — nutrition, allergens, rich-text ingredients
export const TASTE_DETAIL_QUERY = gql`
  query TasteDetail($id: ID!) {
    taste(id: $id) {
      id
      spotId
      title
      titleLocal
      subtitle
      description
      descriptionLocal
      type
      imageUrl
      price
      kcalPerPortion
      kcalPer100g
      portionSizeGrams
      ingredients
      ingredientsLocal
      allergens
      isAvailable
    }
  }
`;
