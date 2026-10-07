"use client";

import type { ComponentType, SVGProps } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { PlatformTrio } from "../BusinessGraphics";
import { IconArrowDown, IconBag, IconCard, IconLink, IconScooter, IconStores } from "../BizIcons";
import { CONTACT_ANCHOR } from "../contact";
import { BTN_PRIMARY, BTN_SECONDARY, Eyebrow, FOCUS_RING, SECTION_ANCHOR } from "../ui";

const CHIPS: { key: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: "orders", Icon: IconBag },
  { key: "card", Icon: IconCard },
  { key: "couriers", Icon: IconScooter },
  { key: "locations", Icon: IconStores },
  { key: "integration", Icon: IconLink },
];

export function BizHero() {
  const { t } = useI18n();
  const contactHref = `#${CONTACT_ANCHOR}`;

  return (
    <section
      id="top"
      aria-labelledby="biz-hero-title"
      className={`relative overflow-hidden bg-gradient-to-b from-cream-soft via-cream to-cream pb-10 pt-12 sm:pb-14 sm:pt-20 ${SECTION_ANCHOR}`}
    >
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.05fr_1fr]">
        <div className="text-center lg:text-left">
          <Eyebrow>{t("business.hero.eyebrow")}</Eyebrow>
          <h1
            id="biz-hero-title"
            className="mt-5 text-balance text-4xl font-black leading-[1.05] tracking-tight text-espresso sm:text-5xl lg:text-[3.4rem]"
          >
            {t("business.hero.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-espresso/70 lg:mx-0">
            {t("business.hero.subtitle")}
            {/* Second sentence only from `sm` up: on phones the chips below carry it, and the CTA stays above the fold. */}
            <span className="hidden sm:inline"> {t("business.hero.subtitle_more")}</span>
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <a href={contactHref} className={`w-full sm:w-auto ${BTN_PRIMARY}`}>
              {t("business.hero.cta_contact")}
            </a>
            <a href="#story" className={`w-full sm:w-auto ${BTN_SECONDARY}`}>
              {t("business.hero.cta_story")}
              <IconArrowDown className="h-4 w-4" />
            </a>
            <a
              href="#pricing"
              className={`inline-flex min-h-[48px] items-center rounded-full px-3 font-semibold text-berry underline decoration-berry/40 underline-offset-4 hover:decoration-berry ${FOCUS_RING}`}
            >
              {t("business.hero.cta_pricing")}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-2.5 lg:justify-start">
            {CHIPS.map(({ key, Icon }) => (
              <li
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-berry/15 bg-white px-3 py-1.5 text-sm font-semibold text-espresso shadow-sm sm:px-3.5 sm:py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-berry" />
                {t(`business.hero.chips.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <PlatformTrio role="img" aria-label={t("business.hero.visual_alt")} className="h-auto w-full drop-shadow-xl" />
        </div>
      </div>
    </section>
  );
}
