import { User } from '@/shared/types';

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
  /** REST error code from the body (`{ code, error, ... }`), when present. */
  code?: string;
  /** The raw error body (e.g. `{ code: 'UPGRADE_REQUIRED', minVersion }`). */
  details?: Record<string, any>;
};

export type LoginRequest = {
  email: string;
  password: string;
  loginContext: 'MOBILE_CLIENT' | 'MOBILE_COURIER' | 'ADMIN_WEB';
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  registrationSource: 'MOBILE_CLIENT' | 'MOBILE_COURIER';
  referralCode?: string;
};

export type VerifyCodeRequest = {
  email: string;
  code: string;
  registrationSource?: 'MOBILE_CLIENT' | 'MOBILE_COURIER';
};

/** The caller's access level at a spot (StaffAccessLevel). */
export type StaffAccessLevel = 'OPERATE' | 'MANAGE_SPOT' | 'MANAGE_BRAND' | 'PLATFORM';

/** Staff kind in the login response: PLATFORM for SUPER_ADMIN, else the brand kind. */
export type StaffKindVM = 'PLATFORM' | 'BRAND_ADMIN' | 'SPOT_ADMIN' | 'EMPLOYEE';

/** One spot of the REST login response (backend `LoginSpot`). */
export type LoginSpot = {
  id: string;
  name: string;
  logoUrl: string | null;
  cityId: string;
  cityName: string;
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  isActive: boolean;
  level: StaffAccessLevel;
};

export type LoginBrand = { id: string; name: string; logoUrl: string | null; isActive: boolean };

/** The REST login `user` for staff (ADMIN namespace). */
export type StaffLoginUser = User & {
  language?: string;
  staffKind?: StaffKindVM;
  mustChangePassword?: boolean;
  brand?: LoginBrand | null;
  spots?: LoginSpot[];
  /** Only set when the user has exactly one spot. */
  spotId?: string | null;
  firstLogin?: boolean;
};

export type LoginResponse = {
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: StaffLoginUser;
};

export type SignupResponse = {
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
};

export type GoogleLoginResponse = {
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
  isFirstTimeGoogleLogin?: boolean;
};

export type PhoneSendCodeResponse = {
  success: boolean;
  message: string;
};

export type PhoneVerifyCodeResponse = {
  success: boolean;
  isNewUser: boolean;
  token: {
    access_token: string;
    type: string;
  };
  refreshToken?: string;
  user: User;
};
