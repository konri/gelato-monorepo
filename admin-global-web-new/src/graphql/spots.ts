import { gql } from '@apollo/client';
import { ADMIN_SPOT_FIELDS, CITY_FIELDS } from './fragments';

export type City = {
  id: string;
  name: string;
  nameLocal?: Record<string, string> | null;
  country?: string;
  timezone?: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
};

export type SpotBrandSummary = {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
};

/** Opening hours as the spot app stores them: { monday: "10:00-22:00", … }. */
export type OpeningHours = Record<string, unknown> | null;

export type AdminSpot = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  cityId: string;
  city?: { id: string; name: string; nameLocal?: Record<string, string> | null } | null;
  latitude: number;
  longitude: number;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  brandId: string;
  brand: SpotBrandSummary;
  timezone: string;
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number | null;
  pickupEnabled: boolean;
  onlinePaymentEnabled: boolean;
  openingHours?: OpeningHours;
  logoUrl?: string | null;
  coverUrl?: string | null;
  photos: string[];
  createdAt: string;
};

export const CITIES = gql`
  query Cities {
    cities {
      ...CityFields
    }
  }
  ${CITY_FIELDS}
`;

export const CREATE_CITY = gql`
  mutation CreateCity(
    $name: String!
    $latitude: Float!
    $longitude: Float!
    $nameLocal: JSON
    $country: String
    $timezone: String
  ) {
    createCity(
      name: $name
      latitude: $latitude
      longitude: $longitude
      nameLocal: $nameLocal
      country: $country
      timezone: $timezone
    ) {
      ...CityFields
    }
  }
  ${CITY_FIELDS}
`;

/** Spots in the caller's reach: PLATFORM every spot (inactive included). */
export const MY_ADMIN_SPOTS = gql`
  query MyAdminSpots {
    myAdminSpots {
      ...AdminSpotFields
    }
  }
  ${ADMIN_SPOT_FIELDS}
`;

/** Every spot of a brand, drafts and deactivated ones included. */
export const BRAND_SPOTS = gql`
  query BrandSpots($brandId: ID) {
    brandSpots(brandId: $brandId, includeInactive: true) {
      ...AdminSpotFields
    }
  }
  ${ADMIN_SPOT_FIELDS}
`;

/** Creates a draft (no client id: the server generates it). */
export const CREATE_SPOT = gql`
  mutation CreateSpot(
    $brandId: ID
    $name: String!
    $address: String!
    $cityId: String!
    $latitude: Float!
    $longitude: Float!
    $phone: String!
    $description: String
    $deliveryEnabled: Boolean
    $deliveryRadiusKm: Float
    $freeDeliveryThreshold: Float
    $pickupEnabled: Boolean
    $onlinePaymentEnabled: Boolean
  ) {
    createSpot(
      brandId: $brandId
      activate: false
      name: $name
      address: $address
      cityId: $cityId
      latitude: $latitude
      longitude: $longitude
      phone: $phone
      description: $description
      deliveryEnabled: $deliveryEnabled
      deliveryRadiusKm: $deliveryRadiusKm
      freeDeliveryThreshold: $freeDeliveryThreshold
      pickupEnabled: $pickupEnabled
      onlinePaymentEnabled: $onlinePaymentEnabled
    ) {
      ...AdminSpotFields
    }
  }
  ${ADMIN_SPOT_FIELDS}
`;

/** Changed fields only; activation goes through SET_SPOT_ACTIVE. */
export const UPDATE_SPOT = gql`
  mutation UpdateSpot(
    $id: ID!
    $name: String
    $cityId: ID
    $address: String
    $latitude: Float
    $longitude: Float
    $phone: String
    $email: String
    $description: String
    $deliveryEnabled: Boolean
    $deliveryRadiusKm: Float
    $deliveryFee: Float
    $freeDeliveryThreshold: Float
    $pickupEnabled: Boolean
    $onlinePaymentEnabled: Boolean
  ) {
    updateSpot(
      id: $id
      name: $name
      cityId: $cityId
      address: $address
      latitude: $latitude
      longitude: $longitude
      phone: $phone
      email: $email
      description: $description
      deliveryEnabled: $deliveryEnabled
      deliveryRadiusKm: $deliveryRadiusKm
      deliveryFee: $deliveryFee
      freeDeliveryThreshold: $freeDeliveryThreshold
      pickupEnabled: $pickupEnabled
      onlinePaymentEnabled: $onlinePaymentEnabled
    ) {
      ...AdminSpotFields
    }
  }
  ${ADMIN_SPOT_FIELDS}
`;

/** Activation takes a slot of maxSpots (SPOT_LIMIT_REACHED); deactivating always works. */
export const SET_SPOT_ACTIVE = gql`
  mutation SetSpotActive($spotId: ID!, $isActive: Boolean!) {
    setSpotActive(spotId: $spotId, isActive: $isActive) {
      ...AdminSpotFields
    }
  }
  ${ADMIN_SPOT_FIELDS}
`;

export const SPOT_DETAIL = gql`
  query SpotDetail($id: ID!) {
    spot(id: $id) {
      ...AdminSpotFields
    }
  }
  ${ADMIN_SPOT_FIELDS}
`;

/** PLATFORM; refused while the spot has history (deactivate it instead). */
export const DELETE_SPOT = gql`
  mutation DeleteSpot($id: ID!) {
    deleteSpot(id: $id)
  }
`;

/** Menu size for the activation checklist (unavailable items included for staff). */
export const SPOT_MENU_COUNT = gql`
  query SpotMenuCount($spotId: ID!) {
    spotTastes(spotId: $spotId, includeUnavailable: true) {
      id
    }
    spotProducts(spotId: $spotId, includeUnavailable: true) {
      id
    }
  }
`;

export const SET_USER_LOGIN_DISABLED = gql`
  mutation SetUserLoginDisabled($userId: ID!, $disabled: Boolean!) {
    setUserLoginDisabled(userId: $userId, disabled: $disabled)
  }
`;

/** True when the spot app has opening hours on the spot. */
export function hasOpeningHours(hours: OpeningHours | undefined): boolean {
  if (!hours || typeof hours !== 'object') return false;
  return Object.values(hours).some((v) =>
    typeof v === 'string' ? v.trim() !== '' : v !== null && v !== undefined && v !== false,
  );
}

export type SpotStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

/**
 * Console status of a spot. The backend has no activation history, so a
 * non-active spot that is not set up yet (no opening hours) counts as a
 * draft; a non-active spot with hours is inactive.
 */
export function spotStatus(spot: Pick<AdminSpot, 'isActive' | 'openingHours'>): SpotStatus {
  if (spot.isActive) return 'ACTIVE';
  return hasOpeningHours(spot.openingHours) ? 'INACTIVE' : 'DRAFT';
}
