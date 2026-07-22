import { gql } from '@apollo/client';

export const SPOT_DETAILS_QUERY = gql`
  query SpotDetailsManage($id: ID!) {
    spot(id: $id) {
      id
      name
      description
      address
      phone
      email
      latitude
      longitude
      logoUrl
      coverUrl
      photos
      openingHours
      hasSeating
      seatingCapacity
      accessibilityFeatures
      deliveryEnabled
      deliveryFee
      freeDeliveryThreshold
      courierPayout
    }
  }
`;

export const SET_SPOT_PHOTOS_MUTATION = gql`
  mutation SetSpotPhotos($id: ID!, $photos: [String!]!) {
    setSpotPhotos(id: $id, photos: $photos) {
      id
      photos
    }
  }
`;

export const UPDATE_SPOT_DETAILS_MUTATION = gql`
  mutation UpdateSpotDetails(
    $id: ID!
    $name: String
    $description: String
    $address: String
    $phone: String
    $email: String
    $latitude: Float
    $longitude: Float
    $openingHours: String
    $hasSeating: Boolean
    $seatingCapacity: Int
    $accessibilityFeatures: String
    $deliveryEnabled: Boolean
    $deliveryFee: Float
    $freeDeliveryThreshold: Float
    $courierPayout: Float
  ) {
    updateSpot(
      id: $id
      name: $name
      description: $description
      address: $address
      phone: $phone
      email: $email
      latitude: $latitude
      longitude: $longitude
      openingHours: $openingHours
      hasSeating: $hasSeating
      seatingCapacity: $seatingCapacity
      accessibilityFeatures: $accessibilityFeatures
      deliveryEnabled: $deliveryEnabled
      deliveryFee: $deliveryFee
      freeDeliveryThreshold: $freeDeliveryThreshold
      courierPayout: $courierPayout
    ) {
      id
    }
  }
`;
