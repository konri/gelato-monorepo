"use client";

import type { ComponentType, SVGProps } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { LoodlyMark } from "../../brand/LoodlyMark";
import { CheckBadge, IconLink, IconStores } from "../BizIcons";
import { CONTACT_ANCHOR } from "../contact";
import { PRICING, formatPrice } from "../pricing.config";
import { BTN_ON_DARK, SECTION_ANCHOR, SectionHeading } from "../ui";

const INCLUDES = ["inc1", "inc2", "inc3", "inc4", "inc5"] as const;

function PriceCard({
  Icon,
  label,
  period,
  price,
  isAmount,
  body,
  bullets = [],
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  period: string;
  /** Formatted amount, or the honest fallback copy when no amount is set. */
  price: string;
  isAmount: boolean;
  body: string;
  bullets?: string[];
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-[2rem] bg-white p-7 shadow-2xl shadow-espresso-dark/30 sm:p-9">
      {/* Wraps on narrow cards (long PL/UA labels), so the period chip never pushes the card past the screen. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-soft text-berry">
            <Icon className="h-6 w-6" />
          </span>
          <h3 className="min-w-0 text-lg font-bold text-espresso [overflow-wrap:anywhere]">{label}</h3>
        </div>
        <span className="mt-2 shrink-0 rounded-full bg-cream-soft px-3 py-1 text-xs font-bold text-berry-dark">{period}</span>
      </div>
      {/* A missing number renders as words, sized so it never reads as a broken price. */}
      <p className={`mt-6 font-black leading-tight text-espresso ${isAmount ? "text-4xl" : "text-2xl"}`}>{price}</p>
      <p className="mt-3 leading-relaxed text-espresso/70">{body}</p>
      {bullets.length > 0 ? (
        <ul className="mt-5 space-y-2.5 border-t border-berry/10 pt-5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-espresso">
              <CheckBadge className="mt-0.5" />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Pricing() {
  const { t, locale } = useI18n();
  const { integrationFeeFrom, perSpotMonthly, vat, currency } = PRICING;

  const integrationPrice =
    integrationFeeFrom == null
      ? t("business.pricing.integration_quote")
      : t("business.pricing.integration_from", { amount: formatPrice(integrationFeeFrom, locale, currency) });
  const spotPrice =
    perSpotMonthly == null
      ? t("business.pricing.spot_fallback")
      : t("business.pricing.spot_amount", { amount: formatPrice(perSpotMonthly, locale, currency) });
  const anyQuote = integrationFeeFrom == null || perSpotMonthly == null;

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className={`relative overflow-hidden bg-gradient-to-br from-berry-dark to-espresso py-20 sm:py-24 ${SECTION_ANCHOR}`}
    >
      <LoodlyMark className="pointer-events-none absolute -bottom-16 -left-14 hidden h-64 w-auto rotate-[-12deg] opacity-[0.05] md:block" />
      <div className="relative mx-auto max-w-5xl px-5">
        <SectionHeading
          id="pricing-title"
          tone="berry"
          eyebrow={t("business.pricing.eyebrow")}
          // "Simple pricing" only once real amounts are set; until then the band explains how the price is built.
          title={t(anyQuote ? "business.pricing.title_quote" : "business.pricing.title")}
          subtitle={t("business.pricing.subtitle")}
        />

        <div className="relative mt-12 grid gap-6 md:grid-cols-2">
          <PriceCard
            Icon={IconLink}
            label={t("business.pricing.integration_label")}
            period={t("business.pricing.integration_period")}
            price={integrationPrice}
            isAmount={integrationFeeFrom != null}
            body={t("business.pricing.integration_body")}
            bullets={[t("business.pricing.integration_inc1"), t("business.pricing.integration_inc2")]}
          />
          <PriceCard
            Icon={IconStores}
            label={t("business.pricing.spot_label")}
            period={t("business.pricing.spot_period")}
            price={spotPrice}
            isAmount={perSpotMonthly != null}
            body={t("business.pricing.spot_body")}
          />
          {/* "then" connector between the two steps */}
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-mango text-2xl font-black text-espresso shadow-lg ring-4 ring-berry-dark md:flex"
          >
            +
          </span>
        </div>

        <div className="mt-8 rounded-[2rem] bg-white/5 p-7 ring-1 ring-white/15 sm:p-9">
          <h3 className="text-lg font-bold text-white">{t("business.pricing.includes_title")}</h3>
          <ul className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {INCLUDES.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <CheckBadge className="mt-0.5" />
                <span className="leading-relaxed text-white/80">{t(`business.pricing.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 space-y-1.5 text-center text-sm text-white/80">
          {vat ? <p>{t(vat === "net" ? "business.pricing.vat_net" : "business.pricing.vat_gross")}</p> : null}
          {anyQuote ? <p>{t("business.pricing.note_quote")}</p> : null}
        </div>

        <div className="mt-8 text-center">
          <a href={`#${CONTACT_ANCHOR}`} className={BTN_ON_DARK}>
            {t("business.pricing.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
