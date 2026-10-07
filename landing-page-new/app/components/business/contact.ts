import { BUSINESS_CONTACT } from "../../lib/site-config";

/**
 * Sales contact for the pitch. The single source of truth is
 * `app/lib/site-config.ts` (shared with the footer); this only widens the
 * literal types so empty values can be tested at runtime.
 *
 * The contact block is the request form, so it is always shown (and the hero
 * and pricing CTAs always point to it). The email only adds the "you can also
 * write to us" fallback line, hidden when empty.
 */
export const CONTACT: { email: string; phone: string } = {
  email: BUSINESS_CONTACT.email,
  phone: BUSINESS_CONTACT.phone,
};

/** In-page anchor of the contact block (`#contact` belongs to the footer). */
export const CONTACT_ANCHOR = "get-in-touch";
