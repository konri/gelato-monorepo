/**
 * Pricing shown on `/for-business` (section `#pricing`).
 *
 * The owner has not set any amounts yet. While a value is `null` the page
 * renders honest fallback copy ("Wycena indywidualna" / "Niewielka miesięczna
 * opłata za każdy lokal") instead of a number — never put a placeholder
 * number here.
 *
 * - `integrationFeeFrom`: one-time setup + integration fee, rendered as "od X".
 * - `perSpotMonthly`: monthly fee per ACTIVE location (spot).
 * - `vat`: whether the amounts are net or gross; `null` hides the VAT line.
 */
export type PricingConfig = {
  currency: "PLN";
  integrationFeeFrom: number | null;
  perSpotMonthly: number | null;
  vat: "net" | "gross" | null;
};

export const PRICING: PricingConfig = {
  currency: "PLN",
  integrationFeeFrom: null,
  perSpotMonthly: null,
  vat: null,
};

const NUMBER_LOCALE = { pl: "pl-PL", en: "en-US", ua: "uk-UA" } as const;

export function formatPrice(
  amount: number,
  locale: keyof typeof NUMBER_LOCALE,
  currency: PricingConfig["currency"] = PRICING.currency,
): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
