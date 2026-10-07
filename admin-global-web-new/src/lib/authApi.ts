import { API_ORIGIN } from './config';
import { CLIENT_HEADERS } from './clientInfo';

export type StaffKind = 'BRAND_ADMIN' | 'SPOT_ADMIN' | 'EMPLOYEE';
export type StaffKindOrPlatform = 'PLATFORM' | StaffKind;

/** `user.brand` of the login response (brand staff only). */
export type LoginBrand = {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
};

/** One entry of `user.spots` (BRANDS_SPEC §2.9). */
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
  level: string;
};

/** The stored console session user (admin_user). */
export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  language?: string | null;
  staffKind: StaffKindOrPlatform;
  mustChangePassword: boolean;
  brand: LoginBrand | null;
  spots: LoginSpot[];
};

/** REST error codes the console handles (`{ code, error }` bodies). */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'EMAIL_NOT_VERIFIED'
  | 'NOT_STAFF'
  | 'NO_MEMBERSHIP'
  | 'USE_SPOT_APP'
  | 'RATE_LIMITED'
  | 'UPGRADE_REQUIRED'
  | 'RESET_CODE_INVALID'
  | 'PASSWORD_WEAK'
  | 'PASSWORD_SAME'
  | 'FIELDS_REQUIRED'
  | 'NETWORK'
  | 'UNKNOWN';

export type AuthFailure = {
  ok: false;
  code: AuthErrorCode;
  /** The server's (localized) text, when it sent one. */
  error?: string;
  status: number;
  /** USE_SPOT_APP: the person's display name. */
  name?: string;
  /** RATE_LIMITED: seconds until the next attempt. */
  retryAfter?: number;
};

export type LoginResult = { ok: true; token: string; user: AdminUser } | AuthFailure;
export type AuthActionResult = { ok: true } | AuthFailure;

const KNOWN_CODES: readonly AuthErrorCode[] = [
  'INVALID_CREDENTIALS',
  'ACCOUNT_DISABLED',
  'EMAIL_NOT_VERIFIED',
  'NOT_STAFF',
  'NO_MEMBERSHIP',
  'USE_SPOT_APP',
  'RATE_LIMITED',
  'UPGRADE_REQUIRED',
  'RESET_CODE_INVALID',
  'PASSWORD_WEAK',
  'PASSWORD_SAME',
  'FIELDS_REQUIRED',
];

type Body = Record<string, unknown>;

async function post(path: string, body: unknown): Promise<{ status: number; data: Body } | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...CLIENT_HEADERS },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Body;
    return { status: res.status, data: data && typeof data === 'object' ? data : {} };
  } catch {
    return null; // network failure (offline, CORS, DNS)
  }
}

function failure(response: { status: number; data: Body } | null): AuthFailure {
  if (!response) return { ok: false, code: 'NETWORK', status: 0 };
  const { status, data } = response;
  const raw = typeof data.code === 'string' ? data.code : '';
  let code: AuthErrorCode = (KNOWN_CODES as readonly string[]).includes(raw)
    ? (raw as AuthErrorCode)
    : 'UNKNOWN';
  if (code === 'UNKNOWN' && status === 426) code = 'UPGRADE_REQUIRED';
  if (code === 'UNKNOWN' && status === 429) code = 'RATE_LIMITED';
  return {
    ok: false,
    code,
    status,
    error: typeof data.error === 'string' ? data.error : undefined,
    name: typeof data.name === 'string' ? data.name : undefined,
    retryAfter: typeof data.retryAfter === 'number' ? data.retryAfter : undefined,
  };
}

function toAdminUser(raw: Body): AdminUser {
  const kind = raw.staffKind;
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: typeof raw.name === 'string' ? raw.name : null,
    roles: Array.isArray(raw.roles) ? raw.roles.map(String) : [],
    language: typeof raw.language === 'string' ? raw.language : null,
    staffKind:
      kind === 'PLATFORM' || kind === 'BRAND_ADMIN' || kind === 'SPOT_ADMIN' || kind === 'EMPLOYEE'
        ? kind
        : 'PLATFORM',
    mustChangePassword: raw.mustChangePassword === true,
    brand: raw.brand && typeof raw.brand === 'object' ? (raw.brand as LoginBrand) : null,
    spots: Array.isArray(raw.spots) ? (raw.spots as LoginSpot[]) : [],
  };
}

/**
 * Admin login against the ADMIN account namespace. Spot admins and employees
 * get USE_SPOT_APP (server gate, or this check if the server let one through):
 * nothing is stored for them.
 */
export async function adminLogin(email: string, password: string): Promise<LoginResult> {
  const response = await post('/authorization/login', {
    email,
    password,
    loginContext: 'ADMIN_WEB',
  });
  const token = (response?.data.token as Body | undefined)?.access_token;
  const rawUser = response?.data.user;
  if (!response || response.status >= 400 || typeof token !== 'string' || !rawUser || typeof rawUser !== 'object') {
    return failure(response);
  }
  const raw = rawUser as Body;
  if (typeof raw.staffKind !== 'string') {
    return { ok: false, code: 'NOT_STAFF', status: 403 };
  }
  const user = toAdminUser(raw);
  if (user.staffKind === 'SPOT_ADMIN' || user.staffKind === 'EMPLOYEE') {
    return { ok: false, code: 'USE_SPOT_APP', status: 403, name: user.name || user.email };
  }
  return { ok: true, token, user };
}

/** Emails a reset code (always answers the same, whether the account exists or not). */
export async function adminForgotPassword(email: string): Promise<AuthActionResult> {
  const response = await post('/authorization/admin/forgot-password', { email });
  if (!response || response.status >= 400) return failure(response);
  return { ok: true };
}

/** Sets a password with an emailed code (forgot password, invite, admin reset). */
export async function adminResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<AuthActionResult> {
  const response = await post('/authorization/admin/reset-password', { email, code, newPassword });
  if (!response || response.status >= 400) return failure(response);
  return { ok: true };
}

/**
 * Changes the password (also ends a restricted session). The server bumps
 * tokenVersion, so the caller must sign in again with the new password.
 */
export async function adminChangePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<AuthActionResult> {
  const response = await post('/authorization/admin/change-password', {
    email,
    currentPassword,
    newPassword,
  });
  if (!response || response.status >= 400) return failure(response);
  return { ok: true };
}
