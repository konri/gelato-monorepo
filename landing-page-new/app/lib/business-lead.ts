import { CLIENT_HEADERS } from "./client-info";
import { publicConfig } from "./public-config";

/**
 * `/for-business` lead form → `submitBusinessLead` (public mutation, saved in
 * the database and listed in the super admin panel).
 *
 * The static export posts here at runtime, straight to NEXT_PUBLIC_API_URL.
 * The client rules below mirror the server's, so most mistakes are caught
 * before a request; the server stays the source of truth (BAD_USER_INPUT with
 * `extensions.field`, RATE_LIMITED).
 */

export const BUSINESS_TYPES = ["ICE_CREAM", "BAKERY", "CAFE", "CONFECTIONERY", "OTHER"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export type LeadLanguage = "PL" | "EN" | "UA";

export const LEAD_LANGUAGE: Record<"pl" | "en" | "ua", LeadLanguage> = { pl: "PL", en: "EN", ua: "UA" };

export interface BusinessLeadInput {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string | null;
  businessTypes: BusinessType[];
  spotsCount: number;
  currentSystem: string | null;
  message: string | null;
  language: LeadLanguage | null;
  consent: boolean;
  /** Honeypot: humans never see it. Sent exactly as typed. */
  website: string;
}

export const SUBMIT_BUSINESS_LEAD = `mutation SubmitBusinessLead($input: BusinessLeadInput!) {
  submitBusinessLead(input: $input)
}`;

/** Server limits (BusinessLeadInput validation). */
export const LEAD_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 254,
  phoneMin: 6,
  phoneMax: 32,
  cityMax: 80,
  typesMin: 1,
  typesMax: 5,
  spotsMin: 1,
  spotsMax: 500,
  systemMax: 120,
  messageMax: 2000,
} as const;

// ------------------------------------------------------------- validation

/** Raw form state (strings as typed). */
export interface LeadFormValues {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  businessTypes: BusinessType[];
  spotsCount: string;
  currentSystem: string;
  message: string;
  consent: boolean;
  website: string;
}

export type LeadField = Exclude<keyof LeadFormValues, "website">;

/** Display / focus order of the fields (error summary follows it). */
export const LEAD_FIELDS: readonly LeadField[] = [
  "companyName",
  "contactName",
  "email",
  "phone",
  "city",
  "spotsCount",
  "businessTypes",
  "currentSystem",
  "message",
  "consent",
];

/**
 * Error codes, used as the last segment of `business.contact.errors.<code>`.
 * `required` variants are for empty fields, the rest describe the rule.
 */
export type LeadErrorCode =
  | "company_required"
  | "company_length"
  | "name_required"
  | "name_length"
  | "email_required"
  | "email_invalid"
  | "phone_required"
  | "phone_invalid"
  | "city_length"
  | "spots_required"
  | "spots_range"
  | "types_required"
  | "system_length"
  | "message_length"
  | "consent_required";

export type LeadErrors = Partial<Record<LeadField, LeadErrorCode>>;

/** Rule message per field, used when the server rejects a field. */
export const SERVER_FIELD_ERROR: Record<LeadField, LeadErrorCode> = {
  companyName: "company_length",
  contactName: "name_length",
  email: "email_invalid",
  phone: "phone_invalid",
  city: "city_length",
  spotsCount: "spots_range",
  businessTypes: "types_required",
  currentSystem: "system_length",
  message: "message_length",
  consent: "consent_required",
};

export const emptyLeadForm = (): LeadFormValues => ({
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  businessTypes: [],
  spotsCount: "",
  currentSystem: "",
  message: "",
  consent: false,
  website: "",
});

// Same patterns and length rules as the server (BusinessLeadResolver):
// single-line fields collapse whitespace, lengths count code points.
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_RE = /^[0-9 +()-]+$/;
const INT_RE = /^\d+$/;

const singleLine = (s: string) => s.replace(/\s+/g, " ").trim();
const len = (s: string) => Array.from(s).length;

/** Validates one field; `undefined` when it is fine. */
export function validateLeadField(field: LeadField, v: LeadFormValues): LeadErrorCode | undefined {
  const L = LEAD_LIMITS;
  switch (field) {
    case "companyName":
    case "contactName": {
      const s = singleLine(v[field]);
      const prefix = field === "companyName" ? "company" : "name";
      if (!s) return `${prefix}_required`;
      return len(s) < L.nameMin || len(s) > L.nameMax ? `${prefix}_length` : undefined;
    }
    case "email": {
      const s = v.email.trim();
      if (!s) return "email_required";
      return s.length > L.emailMax || !EMAIL_RE.test(s) ? "email_invalid" : undefined;
    }
    case "phone": {
      const s = singleLine(v.phone);
      if (!s) return "phone_required";
      return s.length < L.phoneMin || s.length > L.phoneMax || !PHONE_RE.test(s) ? "phone_invalid" : undefined;
    }
    case "city":
      return len(singleLine(v.city)) > L.cityMax ? "city_length" : undefined;
    case "spotsCount": {
      const s = v.spotsCount.trim();
      if (!s) return "spots_required";
      if (!INT_RE.test(s)) return "spots_range";
      const n = Number(s);
      return n < L.spotsMin || n > L.spotsMax ? "spots_range" : undefined;
    }
    case "businessTypes": {
      const n = v.businessTypes.length;
      return n < L.typesMin || n > L.typesMax ? "types_required" : undefined;
    }
    case "currentSystem":
      return len(singleLine(v.currentSystem)) > L.systemMax ? "system_length" : undefined;
    case "message":
      return len(v.message.replace(/\r\n?/g, "\n").trim()) > L.messageMax ? "message_length" : undefined;
    case "consent":
      return v.consent ? undefined : "consent_required";
  }
}

export function validateLeadForm(v: LeadFormValues): LeadErrors {
  const errors: LeadErrors = {};
  for (const field of LEAD_FIELDS) {
    const code = validateLeadField(field, v);
    if (code) errors[field] = code;
  }
  return errors;
}

const optional = (s: string) => {
  const t = s.trim();
  return t ? t : null;
};

/** Form state → mutation input. Call only after `validateLeadForm` passes. */
export function toLeadInput(v: LeadFormValues, language: LeadLanguage | null): BusinessLeadInput {
  return {
    companyName: v.companyName.trim(),
    contactName: v.contactName.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
    city: optional(v.city),
    businessTypes: BUSINESS_TYPES.filter((t) => v.businessTypes.includes(t)),
    spotsCount: Number(v.spotsCount.trim()),
    currentSystem: optional(v.currentSystem),
    message: optional(v.message),
    language,
    consent: v.consent,
    website: v.website,
  };
}

// ------------------------------------------------------------- request

export type LeadSubmitResult =
  | { ok: true }
  /** BAD_USER_INPUT. `fields` holds the form fields the server named (may be empty). */
  | { ok: false; kind: "invalid"; fields: LeadField[] }
  | { ok: false; kind: "rate_limited" }
  /** The request never got an answer (offline, DNS, CORS, timeout). */
  | { ok: false; kind: "network" }
  /** Any other failure on the server side. */
  | { ok: false; kind: "server" };

type GqlError = { message?: string; extensions?: { code?: unknown; field?: unknown } };

const TIMEOUT_MS = 20_000;

/** `input.businessTypes[0]` / `businessTypes` → `businessTypes`, when it is a form field. */
function toFormField(field: unknown): LeadField | null {
  if (typeof field !== "string") return null;
  const last = field.split(".").pop()?.replace(/\[\d*\]$/, "") ?? "";
  return (LEAD_FIELDS as readonly string[]).includes(last) ? (last as LeadField) : null;
}

export async function submitBusinessLead(input: BusinessLeadInput): Promise<LeadSubmitResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(publicConfig.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...CLIENT_HEADERS },
      body: JSON.stringify({
        operationName: "SubmitBusinessLead",
        query: SUBMIT_BUSINESS_LEAD,
        variables: { input },
      }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return { ok: false, kind: "network" };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Not JSON (proxy error page, empty body); handled below.
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) return { ok: false, kind: "rate_limited" };
  if (!body || typeof body !== "object") return { ok: false, kind: res.ok ? "server" : "network" };

  const json = body as {
    data?: { submitBusinessLead?: unknown } | null;
    errors?: GqlError[];
    code?: unknown;
  };

  // REST-style error body ({ code, error }) from middleware in front of /graphql.
  if (typeof json.code === "string" && !json.errors) {
    return json.code === "RATE_LIMITED" ? { ok: false, kind: "rate_limited" } : { ok: false, kind: "server" };
  }

  const errors = Array.isArray(json.errors) ? json.errors : [];
  if (errors.length) {
    const codes = errors.map((e) => e?.extensions?.code);
    if (codes.includes("RATE_LIMITED")) return { ok: false, kind: "rate_limited" };
    if (codes.includes("BAD_USER_INPUT")) {
      const fields: LeadField[] = [];
      for (const e of errors) {
        if (e?.extensions?.code !== "BAD_USER_INPUT") continue;
        const f = toFormField(e.extensions.field);
        if (f && !fields.includes(f)) fields.push(f);
      }
      return { ok: false, kind: "invalid", fields };
    }
    return { ok: false, kind: "server" };
  }

  return json.data?.submitBusinessLead === true ? { ok: true } : { ok: false, kind: "server" };
}
