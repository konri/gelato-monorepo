"use client";

import type { ComponentType, SVGProps } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { IconBag, IconCalendarStar, IconCard, IconReport, IconScooter, IconStores } from "../BizIcons";
import { SECTION_ANCHOR, SectionHeading } from "../ui";

const BENEFITS: { key: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; tile: string }[] = [
  { key: "loyalty", Icon: IconCard, tile: "bg-berry/10 text-berry-dark" },
  { key: "orders", Icon: IconBag, tile: "bg-mango/25 text-espresso" },
  { key: "locations", Icon: IconStores, tile: "bg-pistachio/25 text-espresso" },
  { key: "promotions", Icon: IconCalendarStar, tile: "bg-strawberry/20 text-berry-dark" },
  { key: "couriers", Icon: IconScooter, tile: "bg-mango/25 text-espresso" },
  { key: "reports", Icon: IconReport, tile: "bg-berry/10 text-berry-dark" },
];

export function Benefits() {
  const { t } = useI18n();
  return (
    <section id="benefits" aria-labelledby="benefits-title" className={`bg-cream-soft py-20 sm:py-24 ${SECTION_ANCHOR}`}>
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading id="benefits-title" title={t("business.benefits.title")} subtitle={t("business.benefits.subtitle")} />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ key, Icon, tile }) => (
            <li
              key={key}
              className="rounded-3xl border border-berry/10 bg-white p-7 shadow-sm transition-shadow hover:shadow-xl hover:shadow-berry/10"
            >
              <span aria-hidden className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tile}`}>
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-espresso">{t(`business.benefits.${key}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-espresso/70">{t(`business.benefits.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
