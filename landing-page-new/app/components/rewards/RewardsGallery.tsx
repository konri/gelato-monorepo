"use client";

import { useI18n } from "../../i18n/I18nProvider";
import { RewardGrid } from "./RewardGrid";

/**
 * Landing section "Na co wymienisz punkty?" (`#rewards`): example rewards,
 * from menu treats to merch drawn with the Loodly logo. The note says they
 * are only examples — every catalog belongs to the business that runs it.
 */
export function RewardsGallery() {
  const { t } = useI18n();
  return (
    <section id="rewards" aria-labelledby="rewards-title" className="scroll-mt-20 bg-cream-soft py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="rewards-title" className="text-3xl font-black tracking-tight text-espresso sm:text-4xl">
            {t("rewards.title")}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-espresso/70">{t("rewards.subtitle")}</p>
        </div>
        <div className="mt-12">
          <RewardGrid variant="landing" />
        </div>
        <p className="mt-8 text-center text-sm text-espresso/70">{t("rewards.note")}</p>
      </div>
    </section>
  );
}
