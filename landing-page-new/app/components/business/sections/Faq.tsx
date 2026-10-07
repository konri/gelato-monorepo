"use client";

import Link from "next/link";
import { useI18n } from "../../../i18n/I18nProvider";
import { IconChevronDown } from "../BizIcons";
import { FOCUS_RING, SECTION_ANCHOR, SectionHeading } from "../ui";

const ITEMS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function Faq() {
  const { t } = useI18n();
  return (
    <section id="faq" aria-labelledby="faq-title" className={`bg-cream py-20 sm:py-24 ${SECTION_ANCHOR}`}>
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading id="faq-title" title={t("business.faq.title")} />
        <div className="mt-12 space-y-3">
          {ITEMS.map((n) => (
            <details key={n} className="group rounded-3xl border border-berry/10 bg-white shadow-sm open:shadow-md">
              <summary
                className={`flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-6 py-4 text-left text-lg font-bold text-espresso [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
              >
                <span>{t(`business.faq.q${n}`)}</span>
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-soft text-berry-dark group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
                >
                  <IconChevronDown className="h-5 w-5" />
                </span>
              </summary>
              <div className="px-6 pb-6 leading-relaxed text-espresso/75">
                <p>{t(`business.faq.a${n}`)}</p>
                {n === 7 ? (
                  <p className="mt-3">
                    <Link
                      href="/policy"
                      className={`font-semibold text-berry underline decoration-berry/40 underline-offset-4 hover:decoration-berry ${FOCUS_RING}`}
                    >
                      {t("business.faq.a7_link")}
                    </Link>
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
