import i18n from 'i18next';

/**
 * Server error codes (`errors[].extensions.code` / REST `code`) and their
 * localized texts (`Errors.codes.*`). Apps branch on the code, never on the
 * message text (BRANDS_SPEC §2.8).
 */

/** Codes that are about the request, not the session: they never log out. */
export const DOMAIN_CODES = [
  'SCOPE_FORBIDDEN',
  'PASSWORD_CHANGE_REQUIRED',
  'SPOT_REQUIRED',
  'BRAND_REQUIRED',
  'BRAND_INACTIVE',
  'SPOT_INACTIVE',
  'NOT_FOUND',
  'UPGRADE_REQUIRED',
  'SPOT_LIMIT_REACHED',
  'SPOT_HAS_OPEN_ORDERS',
  'CITY_NOT_IN_BRAND',
  'CITY_IN_USE',
  'CUSTOMER_NOT_FOUND',
  'INSUFFICIENT_POINTS',
  'REWARD_UNAVAILABLE',
  'REWARD_WRONG_BRAND',
  'REWARD_USED',
  'REWARD_EXPIRED',
  'REWARD_INVALID',
  'REWARD_QUANTITY_BELOW_CLAIMED',
  'AWARD_LIMIT_EXCEEDED',
  'SELF_AWARD',
  'STAFF_CONFLICT',
  'BRAND_NAME_TAKEN',
  'BRAND_TASK_INVALID',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMITED',
] as const;

export type DomainCode = (typeof DOMAIN_CODES)[number];

export const isDomainCode = (code: string | null | undefined): code is DomainCode =>
  !!code && (DOMAIN_CODES as readonly string[]).includes(code);

// The server localizes these per required level / reason / field; prefer its text.
const SERVER_TEXT_CODES = new Set(['SCOPE_FORBIDDEN', 'BAD_USER_INPUT']);

/**
 * The text to show for a failed request with `code`, or null when there is no
 * code-specific text (callers then use their own fallback).
 */
export function errorCodeMessage(code: string | null | undefined, serverMessage?: string | null): string | null {
  if (!code) return null;
  if (SERVER_TEXT_CODES.has(code) && serverMessage?.trim()) return serverMessage.trim();
  const key = `Errors.codes.${code}`;
  return i18n.exists(key) ? i18n.t(key) : null;
}

/** A failed request's text: the code's text, else `fallback`. */
export function messageForError(
  error: { message?: string | null; code?: string | null } | null | undefined,
  fallback: string,
): string {
  return errorCodeMessage(error?.code, error?.message) ?? fallback;
}

/** Client-side codes for a request that got no answer (shared/api-client fetchWithTimeout). */
const CONNECTION_CODES = new Set(['REQUEST_TIMEOUT', 'NETWORK_ERROR']);

/** No answer from the server (timeout, offline): the outcome is unknown, so retry with the same requestId. */
export const isConnectionError = (error: { code?: string | null } | null | undefined): boolean =>
  !!error?.code && CONNECTION_CODES.has(error.code);

/**
 * The server answered with a reason it refused the action (a domain code or
 * bad input): nothing was applied, so a later attempt may use a new requestId.
 * Anything else (timeout, offline, a 5xx) leaves the outcome unknown.
 */
export const isDefinitiveRejection = (error: { code?: string | null } | null | undefined): boolean =>
  isDomainCode(error?.code) || error?.code === 'BAD_USER_INPUT';
