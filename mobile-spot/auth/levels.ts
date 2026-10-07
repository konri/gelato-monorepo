import type { StaffAccessLevel } from '@/shared/api-client/src/api/types';

/**
 * Client mirror of the backend access levels (BRANDS_SPEC §1.3, §4.5).
 *
 * The level always comes from the ACTIVE spot (`StaffSpot.level` from
 * myStaffContext / the login response), never from the global roles. Client
 * gating is UX only; the server is authoritative.
 */
export type AccessLevel = StaffAccessLevel;

const RANK: Record<AccessLevel, number> = {
  OPERATE: 10,
  MANAGE_SPOT: 20,
  MANAGE_BRAND: 30,
  PLATFORM: 40,
};

export const isAccessLevel = (value: unknown): value is AccessLevel =>
  typeof value === 'string' && value in RANK;

/** True when `level` is at least `min` (null = no access). */
export function atLeast(level: AccessLevel | null | undefined, min: AccessLevel): boolean {
  return !!level && RANK[level] >= RANK[min];
}

export type Capabilities = {
  // OPERATE (every staff member of the spot)
  operateOrders: boolean;
  cancelWithApology: boolean;
  collectOrder: boolean;
  collectWithoutQr: boolean;
  awardTemplate: boolean;
  redeemReward: boolean;
  toggleAvailability: boolean;
  viewCouriers: boolean;
  viewCanceled: boolean;
  // MANAGE_SPOT (spot admin and up)
  awardCustom: boolean;
  manageTemplates: boolean;
  editMenu: boolean;
  editSpotDetails: boolean;
  viewDashboard: boolean;
  exportReports: boolean;
  viewComplaints: boolean;
  postNews: boolean;
  viewHistory: boolean;
  manageStaff: boolean;
  createEmployee: boolean;
  reviewCourierApplications: boolean;
  viewCourierEarnings: boolean;
  viewSessions: boolean;
  // MANAGE_BRAND (brand admin and the Loodly team)
  editCrucialSpotFields: boolean;
  createSpotAdmin: boolean;
  assignSpotAdminSpots: boolean;
  changeStaffKind: boolean;
  brandReports: boolean;
  openBrandAdminWeb: boolean;
};

export function capabilitiesFor(level: AccessLevel | null | undefined): Capabilities {
  const o = atLeast(level, 'OPERATE');
  const s = atLeast(level, 'MANAGE_SPOT');
  const b = atLeast(level, 'MANAGE_BRAND');
  return {
    operateOrders: o,
    cancelWithApology: o,
    collectOrder: o,
    collectWithoutQr: o,
    awardTemplate: o,
    redeemReward: o,
    toggleAvailability: o,
    viewCouriers: o,
    viewCanceled: o,
    awardCustom: s,
    manageTemplates: s,
    editMenu: s,
    editSpotDetails: s,
    viewDashboard: s,
    exportReports: s,
    viewComplaints: s,
    postNews: s,
    viewHistory: s,
    manageStaff: s,
    createEmployee: s,
    reviewCourierApplications: s,
    viewCourierEarnings: s,
    viewSessions: s,
    editCrucialSpotFields: b,
    createSpotAdmin: b,
    assignSpotAdminSpots: b,
    changeStaffKind: b,
    brandReports: b,
    openBrandAdminWeb: b,
  };
}

/** `Roles.*` translation key for a staff kind (PLATFORM = the Loodly team). */
export function roleKeyFor(staffKind: string | null | undefined): string | null {
  switch (staffKind) {
    case 'PLATFORM':
      return 'Roles.SUPER_ADMIN';
    case 'BRAND_ADMIN':
      return 'Roles.BRAND_ADMIN';
    case 'SPOT_ADMIN':
      return 'Roles.SPOT_ADMIN';
    case 'EMPLOYEE':
      return 'Roles.EMPLOYEE';
    default:
      return null;
  }
}
