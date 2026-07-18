import { gql } from '@apollo/client';

export type AdminSpot = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  cityId?: string;
  city?: { id: string; name: string } | null;
  latitude: number;
  longitude: number;
  phone?: string | null;
  deliveryEnabled?: boolean;
  deliveryRadiusKm?: number;
  isActive?: boolean;
};

export type City = { id: string; name: string };

export const CREATE_CITY = gql`
  mutation CreateCity(
    $name: String!
    $latitude: Float!
    $longitude: Float!
    $nameLocal: JSON
    $country: String
  ) {
    createCity(
      name: $name
      latitude: $latitude
      longitude: $longitude
      nameLocal: $nameLocal
      country: $country
    ) {
      id
      name
    }
  }
`;

// Spots the current admin manages (all for SUPER_ADMIN/SPOTS_ADMIN).
export const MY_ADMIN_SPOTS = gql`
  query MyAdminSpots {
    myAdminSpots {
      id
      name
      address
      latitude
      longitude
      phone
      isActive
      city {
        id
        name
      }
    }
  }
`;

export const CITIES = gql`
  query Cities {
    cities {
      id
      name
    }
  }
`;

export const CREATE_SPOT = gql`
  mutation CreateSpot(
    $id: String!
    $name: String!
    $address: String!
    $cityId: String!
    $latitude: Float!
    $longitude: Float!
    $phone: String!
    $description: String
    $deliveryEnabled: Boolean
    $deliveryRadiusKm: Float
  ) {
    createSpot(
      id: $id
      name: $name
      address: $address
      cityId: $cityId
      latitude: $latitude
      longitude: $longitude
      phone: $phone
      description: $description
      deliveryEnabled: $deliveryEnabled
      deliveryRadiusKm: $deliveryRadiusKm
    ) {
      id
      name
    }
  }
`;

export const UPDATE_SPOT = gql`
  mutation UpdateSpot(
    $id: ID!
    $name: String
    $description: String
    $address: String
    $phone: String
    $latitude: Float
    $longitude: Float
    $deliveryRadiusKm: Float
    $isActive: Boolean
  ) {
    updateSpot(
      id: $id
      name: $name
      description: $description
      address: $address
      phone: $phone
      latitude: $latitude
      longitude: $longitude
      deliveryRadiusKm: $deliveryRadiusKm
      isActive: $isActive
    ) {
      id
      name
      isActive
    }
  }
`;

export type SpotAdmin = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  loginDisabled: boolean;
};

export const SPOT_DETAIL = gql`
  query SpotDetail($id: ID!) {
    spot(id: $id) {
      id
      name
      description
      address
      latitude
      longitude
      phone
      deliveryEnabled
      deliveryRadiusKm
      isActive
    }
  }
`;

export const SPOT_ADMINS = gql`
  query SpotAdmins($spotId: ID!) {
    spotAdmins(spotId: $spotId) {
      id
      email
      name
      roles
      loginDisabled
    }
  }
`;

export const SET_USER_LOGIN_DISABLED = gql`
  mutation SetUserLoginDisabled($userId: ID!, $disabled: Boolean!) {
    setUserLoginDisabled(userId: $userId, disabled: $disabled)
  }
`;

export const RESEND_ADMIN_INVITE = gql`
  mutation ResendAdminInvite($userId: ID!) {
    resendAdminInvite(userId: $userId)
  }
`;

export const INVITE_SPOT_ADMIN = gql`
  mutation InviteSpotAdmin($spotId: ID!, $email: String!, $name: String!) {
    inviteSpotAdmin(spotId: $spotId, email: $email, name: $name) {
      id
      email
      roles
    }
  }
`;
