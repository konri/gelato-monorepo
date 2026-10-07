export type StaffKind = 'BRAND_ADMIN' | 'SPOT_ADMIN' | 'EMPLOYEE';

/** A member of the brand's team (StaffMember). */
export type BrandStaffMember = {
  id: string;
  email: string;
  name?: string | null;
  kind?: StaffKind | null;
  role: string;
  brandId?: string | null;
  /** Assigned spots (spot admin: one or more; employee: exactly one). */
  spotIds: string[];
  spots: { id: string; name: string }[];
  loginDisabled: boolean;
  /** Invited but never signed in. */
  invitePending: boolean;
  createdAt: string;
};

export type InviteStaffInput = {
  email: string;
  name: string;
  kind: StaffKind;
  spotIds: string[];
  /** Hand over a temporary password instead of emailing an invitation. */
  password?: string;
  language?: 'PL' | 'EN' | 'UA';
  /** The Loodly team names the brand; brand staff never do. */
  brandId?: string;
};

export type StaffLoginSession = {
  id: string;
  userId: string;
  staffName: string;
  role: string;
  /** 'LOGIN' or 'SPOT_SWITCH'. */
  event: string;
  clientApp?: string | null;
  ipAddress?: string | null;
  loginAt: string;
};
