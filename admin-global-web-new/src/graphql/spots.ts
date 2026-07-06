import { gql } from '@apollo/client';

export type AdminSpot = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  isActive?: boolean;
};

export type City = { id: string; name: string };

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
      deliveryRadiusKm: $deliveryRadiusKm
    ) {
      id
      name
    }
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
