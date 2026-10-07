/**
 * Public site configuration shared by the landing (footer, app section) and
 * the `/for-business` pitch.
 *
 * - The email comes from the terms page (`app/terms/TermsContentPl.tsx`).
 *   No Loodly phone number exists in the codebase, so `phone` stays empty
 *   (the numbers in the privacy policy belong to the data-protection
 *   authority). Empty values are hidden in the UI — never invent them.
 * - Store / download URLs come from env vars, inlined at build time. When a
 *   value is empty the matching badge or QR code is not rendered.
 */

export const BUSINESS_CONTACT = { email: "kontakt@loodly.pl", phone: "" } as const;

export const hasBusinessContact = Boolean(BUSINESS_CONTACT.email || BUSINESS_CONTACT.phone);

/** Empty string = hidden. */
export const SOCIAL_LINKS = { facebook: "", instagram: "", tiktok: "" } as const;

export const APP_LINKS = {
  ios: process.env.NEXT_PUBLIC_IOS_APP_URL ?? "",
  android: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? "",
  /** Target of the "scan to download" QR code; the QR is hidden when empty. */
  download: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ?? "",
} as const;
