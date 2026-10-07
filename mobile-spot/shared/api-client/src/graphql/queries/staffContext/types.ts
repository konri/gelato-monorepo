import type { StaffAccessLevel } from '../../../api/types';

export type StaffScopeKind = 'PLATFORM' | 'BRAND_ADMIN' | 'SPOT_ADMIN' | 'EMPLOYEE' | 'NONE';

export type StaffContextBrand = {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
};

export type StaffSpotRow = {
  spotId: string;
  brandId: string;
  brandName: string;
  brandLogoUrl?: string | null;
  level: StaffAccessLevel;
  isActive: boolean;
  pendingOrderCount: number;
  myOpenClaimedCount: number;
  staffCount: number;
  manualAwardCap?: number | null;
  spot: {
    id: string;
    name: string;
    address?: string | null;
    logoUrl?: string | null;
    cityId?: string | null;
    city?: { id: string; name: string; nameLocal?: Record<string, string> | null } | null;
    brand?: StaffContextBrand | null;
  };
};

export type StaffContext = {
  scope: StaffScopeKind;
  canManageBrand: boolean;
  mustChangePassword: boolean;
  defaultSpotId?: string | null;
  brand?: StaffContextBrand | null;
  spots: StaffSpotRow[];
};

export type StaffSpotCounters = {
  spotId: string;
  level: StaffAccessLevel;
  isActive: boolean;
  pendingOrderCount: number;
  myOpenClaimedCount: number;
  staffCount: number;
  manualAwardCap?: number | null;
};

export type MyStaffContextResponse = { myStaffContext: StaffContext };
export type MyStaffSpotsResponse = { myStaffSpots: StaffSpotCounters[] };
export type SelectActiveSpotResponse = {
  selectActiveSpot: { spotId: string; pendingOrderCount: number; myOpenClaimedCount: number };
};
