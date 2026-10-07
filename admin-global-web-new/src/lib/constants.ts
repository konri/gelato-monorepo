/** Shared console limits and lists (mirrors of the backend rules). */

/**
 * Upload limits. The backend's S3 check accepts at most 5 MB (multer allows
 * 10 MB, S3Service.validateImage refuses above 5 MB), so the console stops at 5.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPTED_IMAGE_INPUT = ACCEPTED_IMAGE_TYPES.join(',');

/** Brand name length (BrandService.normalizeBrandName). */
export const BRAND_NAME_MIN = 2;
export const BRAND_NAME_MAX = 60;
export const BRAND_DESCRIPTION_MAX = 2000;
export const BILLING_NOTE_MAX = 1000;
export const MAX_SPOTS_LIMIT = 10000;

/** Drafts and deactivated spots allowed on top of maxSpots (E3, DRAFT_SPOT_ALLOWANCE). */
export const DRAFT_SPOT_ALLOWANCE = 5;

/** Ranges of the brand loyalty settings (Brand_limits_check). */
export const SETTINGS_RANGES = {
  birthdayBonusPoints: [0, 100000],
  referralBonusPoints: [0, 100000],
  fallbackPointsPerPln: [0, 1000],
  manualAwardCap: [0, 1000000],
  staffDailyAwardCap: [0, 1000000],
} as const;

/** Password rules of the backend (PasswordUtil.hashPassword). */
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = 'length' | 'upper' | 'lower' | 'digit';

/** Rules the password does not meet yet (empty = fine). */
export function passwordProblems(password: string): PasswordRule[] {
  const out: PasswordRule[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) out.push('length');
  if (!/[A-Z]/.test(password)) out.push('upper');
  if (!/[a-z]/.test(password)) out.push('lower');
  if (!/[0-9]/.test(password)) out.push('digit');
  return out;
}

/** GraphQL `Language` values for invites. */
export const STAFF_LANGUAGES = ['PL', 'EN', 'UA'] as const;
export type StaffLanguage = (typeof STAFF_LANGUAGES)[number];

/** The console's UI language as a GraphQL `Language`. */
export function staffLanguageFor(uiLanguage: string | undefined): StaffLanguage {
  const lng = (uiLanguage ?? '').slice(0, 2).toLowerCase();
  if (lng === 'en') return 'EN';
  if (lng === 'ua' || lng === 'uk') return 'UA';
  return 'PL';
}

const FALLBACK_EUROPE_TIME_ZONES = [
  'Europe/Amsterdam', 'Europe/Athens', 'Europe/Belgrade', 'Europe/Berlin', 'Europe/Bratislava',
  'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest', 'Europe/Chisinau', 'Europe/Copenhagen',
  'Europe/Dublin', 'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Kyiv', 'Europe/Lisbon',
  'Europe/Ljubljana', 'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Oslo',
  'Europe/Paris', 'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Sofia', 'Europe/Stockholm',
  'Europe/Tallinn', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Warsaw', 'Europe/Zagreb', 'Europe/Zurich',
];

/** IANA `Europe/*` zones for the city time-zone select. */
export function europeTimeZones(): string[] {
  try {
    const zones = Intl.supportedValuesOf('timeZone').filter((z) => z.startsWith('Europe/'));
    // Some engines still list Kyiv as Europe/Kiev; the backend accepts both.
    if (!zones.includes('Europe/Kyiv')) zones.push('Europe/Kyiv');
    return zones.sort();
  } catch {
    return FALLBACK_EUROPE_TIME_ZONES;
  }
}

/** The backend's default zone for a new city (Ukraine → Kyiv, else Warsaw). */
export function defaultTimeZoneForCountry(country: string): string {
  const c = country.trim().toLowerCase();
  if (c.startsWith('ukrain') || c === 'ua' || c === 'україна' || c.startsWith('ukrai')) return 'Europe/Kyiv';
  return 'Europe/Warsaw';
}
