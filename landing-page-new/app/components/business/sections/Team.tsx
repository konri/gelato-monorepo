"use client";

import { useI18n } from "../../../i18n/I18nProvider";
import { RoleIcon, type BusinessRole } from "../BusinessGraphics";
import { CheckBadge, IconShield } from "../BizIcons";
import { SECTION_ANCHOR, SectionHeading } from "../ui";

const ROLES: { role: BusinessRole; chip: string }[] = [
  { role: "brandAdmin", chip: "bg-mango/30" },
  { role: "locationAdmin", chip: "bg-pistachio/30" },
  { role: "employee", chip: "bg-strawberry/20" },
];

const SAFETY = ["safety1", "safety2", "safety3"] as const;

export function Team() {
  const { t } = useI18n();
  return (
    <section id="roles" aria-labelledby="roles-title" className={`bg-cream-soft py-20 sm:py-24 ${SECTION_ANCHOR}`}>
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading id="roles-title" title={t("business.roles.title")} subtitle={t("business.roles.subtitle")} />

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {ROLES.map(({ role, chip }) => (
            <li key={role} className="flex flex-col rounded-3xl border border-berry/10 bg-white p-7 shadow-sm">
              <RoleIcon role={role} className="h-12 w-12" />
              <h3 className="mt-5 text-xl font-bold text-espresso">{t(`business.roles.${role}.title`)}</h3>
              <p className="mt-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-espresso ${chip}`}>
                  {t(`business.roles.${role}.scope`)}
                </span>
              </p>
              <p className="mt-3 leading-relaxed text-espresso/70">{t(`business.roles.${role}.body`)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-3xl border border-berry/10 bg-white p-7 sm:p-9">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-soft text-berry">
              <IconShield className="h-6 w-6" />
            </span>
            <h3 className="text-xl font-bold text-espresso">{t("business.roles.safety_title")}</h3>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {SAFETY.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <CheckBadge className="mt-0.5" />
                <span className="leading-relaxed text-espresso">{t(`business.roles.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
