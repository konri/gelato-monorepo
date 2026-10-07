import { gql } from '@apollo/client';
import { BRAND_ADMIN_VIEW_FIELDS, STAFF_MEMBER_FIELDS } from './fragments';
import type { City } from './spots';
import type { StaffMember } from './staff';

export type LocalizedText = { pl?: string | null; en?: string | null; ua?: string | null };

export type Brand = {
  id: string;
  name: string;
  description?: string | null;
  descriptionLocal?: LocalizedText | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isActive: boolean;
  cityIds: string[];
  cities: City[];
  rewardCount: number;
  birthdayBonusPoints: number;
  referralBonusPoints: number;
};

export type BrandSettings = {
  birthdayBonusEnabled: boolean;
  birthdayBonusPoints: number;
  referralBonusPoints: number;
  fallbackPointsPerPln: number;
  manualAwardCap: number;
  staffDailyAwardCap: number;
};

export type SpotQuota = {
  maxSpots: number;
  activeSpots: number;
  remaining: number;
  totalSpots: number;
};

export type BrandAdminView = {
  brand: Brand;
  settings: BrandSettings;
  quota: SpotQuota;
  totalSpots: number;
  staffCount: number;
  /** PLATFORM only (null for brand staff). */
  billingNote?: string | null;
  createdAt: string;
};

export type BrandSettingsInput = Partial<BrandSettings>;

export type CreateBrandInput = {
  name: string;
  description?: string | null;
  descriptionLocal?: LocalizedText | null;
  cityIds: string[];
  maxSpots: number;
  admin: { email: string; name: string; language?: 'PL' | 'EN' | 'UA' };
  settings?: BrandSettingsInput;
  billingNote?: string | null;
};

/** Omitted = unchanged; null clears. */
export type UpdateBrandProfileInput = {
  description?: string | null;
  descriptionLocal?: LocalizedText | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
};

export type UpdateBrandPlatformInput = {
  name?: string;
  maxSpots?: number;
  isActive?: boolean;
  billingNote?: string | null;
};

/** Every brand with quota and staff count (PLATFORM). */
export const ADMIN_BRANDS = gql`
  query AdminBrands($includeInactive: Boolean = true) {
    adminBrands(includeInactive: $includeInactive) {
      ...BrandAdminViewFields
    }
  }
  ${BRAND_ADMIN_VIEW_FIELDS}
`;

/** One brand's console view (PLATFORM, or the brand's admin). */
export const ADMIN_BRAND = gql`
  query AdminBrand($id: ID!) {
    adminBrand(id: $id) {
      ...BrandAdminViewFields
    }
  }
  ${BRAND_ADMIN_VIEW_FIELDS}
`;

export const CREATE_BRAND = gql`
  mutation CreateBrand($input: CreateBrandInput!) {
    createBrand(input: $input) {
      brand {
        ...BrandAdminViewFields
      }
      admin {
        ...StaffMemberFields
      }
    }
  }
  ${BRAND_ADMIN_VIEW_FIELDS}
  ${STAFF_MEMBER_FIELDS}
`;

export const UPDATE_BRAND_PLATFORM = gql`
  mutation UpdateBrandPlatform($brandId: ID!, $input: UpdateBrandPlatformInput!) {
    updateBrandPlatform(brandId: $brandId, input: $input) {
      ...BrandAdminViewFields
    }
  }
  ${BRAND_ADMIN_VIEW_FIELDS}
`;

export const UPDATE_BRAND_PROFILE = gql`
  mutation UpdateBrandProfile($brandId: ID, $input: UpdateBrandProfileInput!) {
    updateBrandProfile(brandId: $brandId, input: $input) {
      ...BrandAdminViewFields
    }
  }
  ${BRAND_ADMIN_VIEW_FIELDS}
`;

export const SET_BRAND_CITIES = gql`
  mutation SetBrandCities($brandId: ID, $cityIds: [ID!]!) {
    setBrandCities(brandId: $brandId, cityIds: $cityIds) {
      ...BrandAdminViewFields
    }
  }
  ${BRAND_ADMIN_VIEW_FIELDS}
`;

export const UPDATE_BRAND_SETTINGS = gql`
  mutation UpdateBrandSettings($brandId: ID, $input: BrandSettingsInput!) {
    updateBrandSettings(brandId: $brandId, input: $input) {
      ...BrandAdminViewFields
    }
  }
  ${BRAND_ADMIN_VIEW_FIELDS}
`;

export const INVITE_BRAND_ADMIN = gql`
  mutation InviteBrandAdmin($brandId: ID!, $email: String!, $name: String!, $language: Language) {
    inviteBrandAdmin(brandId: $brandId, email: $email, name: $name, language: $language) {
      ...StaffMemberFields
    }
  }
  ${STAFF_MEMBER_FIELDS}
`;

export const MOVE_SPOT_TO_BRAND = gql`
  mutation MoveSpotToBrand($spotId: ID!, $brandId: ID!) {
    moveSpotToBrand(spotId: $spotId, brandId: $brandId) {
      id
      brandId
      brand {
        id
        name
        logoUrl
        isActive
      }
    }
  }
`;

export const DELETE_BRAND = gql`
  mutation DeleteBrand($brandId: ID!) {
    deleteBrand(brandId: $brandId)
  }
`;

export type CreateBrandResult = { createBrand: { brand: BrandAdminView; admin: StaffMember } };
