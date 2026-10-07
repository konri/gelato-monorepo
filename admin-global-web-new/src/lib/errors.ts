import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';
import i18n from '../translations';

/**
 * Error codes → console text (BRANDS_SPEC §3.1). Known `extensions.code`
 * values map to `Errors.<CODE>` (variables from `extensions`); network
 * failures to `Errors.NETWORK`; anything else shows the first server message.
 */

/** Codes with an `Errors.<CODE>` text, and the extension variables each text needs. */
const ERROR_VARS: Record<string, readonly string[]> = {
  UNAUTHENTICATED: [],
  SESSION_EXPIRED: [],
  SCOPE_FORBIDDEN: [],
  PASSWORD_CHANGE_REQUIRED: [],
  SPOT_REQUIRED: [],
  BRAND_REQUIRED: [],
  BRAND_INACTIVE: [],
  SPOT_INACTIVE: [],
  NOT_FOUND: [],
  UPGRADE_REQUIRED: [],
  SPOT_LIMIT_REACHED: ['maxSpots'],
  SPOT_HAS_OPEN_ORDERS: [],
  CITY_NOT_IN_BRAND: [],
  CITY_IN_USE: [],
  CUSTOMER_NOT_FOUND: [],
  INSUFFICIENT_POINTS: ['missingPoints', 'brandName'],
  REWARD_UNAVAILABLE: [],
  REWARD_WRONG_BRAND: [],
  REWARD_USED: [],
  REWARD_EXPIRED: [],
  REWARD_INVALID: [],
  REWARD_QUANTITY_BELOW_CLAIMED: [],
  AWARD_LIMIT_EXCEEDED: ['cap'],
  SELF_AWARD: [],
  STAFF_CONFLICT: [],
  BRAND_NAME_TAKEN: [],
  BRAND_TASK_INVALID: [],
  IDEMPOTENCY_CONFLICT: [],
  NO_MEMBERSHIP: [],
  NOT_STAFF: [],
  USE_SPOT_APP: [],
  INVALID_CREDENTIALS: [],
  ACCOUNT_DISABLED: [],
  EMAIL_NOT_VERIFIED: [],
  RATE_LIMITED: [],
  RESET_CODE_INVALID: [],
  PASSWORD_WEAK: [],
  PASSWORD_SAME: [],
  FIELDS_REQUIRED: [],
  UPLOAD_TOO_LARGE: [],
  UPLOAD_TYPE: [],
  NETWORK: [],
  UNKNOWN: [],
};

export type ErrorInfo = {
  /** `extensions.code` (GraphQL), `code` (REST) or NETWORK / UNKNOWN. */
  code: string;
  /** The server's first message (already localized for the account's language). */
  message: string | null;
  extensions: Record<string, unknown>;
};

type GraphQLErrorShape = { message?: unknown; extensions?: Record<string, unknown> | null };

function fromGraphQLErrors(errors: readonly GraphQLErrorShape[]): ErrorInfo | null {
  const first = errors[0];
  if (!first) return null;
  const extensions = (first.extensions ?? {}) as Record<string, unknown>;
  const code = typeof extensions.code === 'string' ? extensions.code : 'UNKNOWN';
  return { code, message: typeof first.message === 'string' ? first.message : null, extensions };
}

/** A REST / HTTP body: `{ code, error }` or a GraphQL `{ errors: [...] }`. */
function fromBody(text: string): ErrorInfo | null {
  try {
    const body = JSON.parse(text) as Record<string, unknown>;
    if (Array.isArray(body.errors)) return fromGraphQLErrors(body.errors as GraphQLErrorShape[]);
    if (typeof body.code === 'string') {
      const { code, error, ...rest } = body;
      return { code, message: typeof error === 'string' ? error : null, extensions: rest };
    }
  } catch {
    // not JSON
  }
  return null;
}

/** Any thrown value → `{ code, message, extensions }`. */
export function errorInfo(err: unknown): ErrorInfo {
  if (CombinedGraphQLErrors.is(err)) {
    return fromGraphQLErrors(err.errors) ?? { code: 'UNKNOWN', message: err.message, extensions: {} };
  }
  if (ServerError.is(err)) {
    const parsed = fromBody(err.bodyText);
    if (parsed) return parsed;
    if (err.statusCode === 401) return { code: 'UNAUTHENTICATED', message: null, extensions: {} };
    if (err.statusCode === 426) return { code: 'UPGRADE_REQUIRED', message: null, extensions: {} };
    return { code: 'UNKNOWN', message: null, extensions: {} };
  }
  if (ServerParseError.is(err)) return { code: 'UNKNOWN', message: null, extensions: {} };
  if (err instanceof AppError) return { code: err.code, message: err.serverMessage, extensions: err.extensions };
  if (err instanceof TypeError) return { code: 'NETWORK', message: null, extensions: {} }; // fetch failed
  if (err instanceof Error) return { code: 'UNKNOWN', message: err.message || null, extensions: {} };
  return { code: 'UNKNOWN', message: null, extensions: {} };
}

/** The error's code (`extensions.code`, REST `code`, NETWORK or UNKNOWN). */
export function errorCode(err: unknown): string {
  return errorInfo(err).code;
}

/** Text for a code; null when the console has no text for it (or a variable is missing). */
export function codeText(code: string, extensions: Record<string, unknown> = {}): string | null {
  // Variants with their own text.
  if (code === 'SPOT_LIMIT_REACHED' && extensions.kind === 'TOTAL') {
    const max = Number(extensions.maxSpots);
    if (Number.isFinite(max)) return i18n.t('Errors.SPOT_LIMIT_TOTAL', { total: max + 5 });
  }
  if (code === 'SCOPE_FORBIDDEN' && typeof extensions.requiredLevel === 'string') {
    const key = `Errors.SCOPE_FORBIDDEN_${extensions.requiredLevel}`;
    if (i18n.exists(key)) return i18n.t(key);
  }
  if (code === 'REWARD_UNAVAILABLE' && extensions.reason === 'OUT_OF_STOCK') {
    return i18n.t('Errors.REWARD_OUT_OF_STOCK');
  }
  if (code === 'AWARD_LIMIT_EXCEEDED' && extensions.kind === 'DAILY' && extensions.cap != null) {
    return i18n.t('Errors.AWARD_LIMIT_DAILY', { cap: extensions.cap });
  }
  const vars = ERROR_VARS[code];
  if (!vars) return null;
  if (vars.some((v) => extensions[v] === undefined || extensions[v] === null)) return null;
  return i18n.t(`Errors.${code}`, extensions as Record<string, unknown>);
}

/**
 * Text to show for any error: the console's text for a known code, else the
 * first server message, else a fallback (`Errors.UNKNOWN` by default).
 */
export function errorText(err: unknown, fallback?: string): string {
  const info = errorInfo(err);
  // BAD_USER_INPUT and unknown codes: the server's message is the precise one.
  if (info.code !== 'BAD_USER_INPUT') {
    const text = codeText(info.code, info.extensions);
    if (text) return text;
  }
  return info.message || fallback || i18n.t('Errors.UNKNOWN');
}

/** `extensions.field` of an input error (e.g. 'name', 'admin.email'), if any. */
export function errorField(err: unknown): string | null {
  const field = errorInfo(err).extensions.field;
  return typeof field === 'string' ? field : null;
}

/** A coded error raised by the console itself (uploads, REST helpers). */
export class AppError extends Error {
  readonly code: string;
  readonly serverMessage: string | null;
  readonly extensions: Record<string, unknown>;

  constructor(code: string, serverMessage: string | null = null, extensions: Record<string, unknown> = {}) {
    super(serverMessage ?? code);
    this.name = 'AppError';
    this.code = code;
    this.serverMessage = serverMessage;
    this.extensions = extensions;
  }
}
