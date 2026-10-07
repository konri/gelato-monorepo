"use client";

import { useI18n } from "../../../i18n/I18nProvider";
// Shared with the landing's rewards gallery (brief §5.2–5.3); item names come
// from `rewards.items.<id>` in common.json.
import { RewardGrid } from "../../rewards/RewardGrid";
import type { RewardId } from "../../rewards/RewardIllustrations";
import { SECTION_ANCHOR, SectionHeading } from "../ui";

/** Merch examples only — food rewards are covered in the story (scene "rewards"). */
const MERCH: RewardId[] = ["umbrella", "mug", "tote", "cap", "thermal", "tshirt"];

export function BizRewards() {
  const { t } = useI18n();
  return (
    <section id="rewards" aria-labelledby="biz-rewards-title" className={`bg-cream py-20 sm:py-24 ${SECTION_ANCHOR}`}>
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading id="biz-rewards-title" title={t("business.rewards.title")} subtitle={t("business.rewards.body")} />
        <div className="mt-12">
          <RewardGrid ids={MERCH} variant="compact" />
        </div>
        <p className="mt-6 text-center text-sm text-espresso/70">{t("business.rewards.note")}</p>
      </div>
    </section>
  );
}
