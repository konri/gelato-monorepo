"use client";

import type { ComponentType, SVGProps } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import { LottieScene } from "../../lottie/LottieScene";
import { STORY_ACTS, type SceneName } from "../../lottie/scenes";
import { IconKey, IconMapPin, IconScan } from "../BizIcons";
import { FOCUS_RING, SECTION_ANCHOR, SectionHeading } from "../ui";

const ACT_ICONS: Record<(typeof STORY_ACTS)[number]["id"], ComponentType<SVGProps<SVGSVGElement>>> = {
  setup: IconKey,
  counter: IconScan,
  beyond: IconMapPin,
};

const TOTAL_SCENES = STORY_ACTS.reduce((n, act) => n + act.scenes.length, 0);

const ALL_SCENES: readonly SceneName[] = STORY_ACTS.flatMap((act) => act.scenes as readonly SceneName[]);

/** 1-based position of every scene across all acts ("Krok 5 z 10"). */
const SCENE_STEP: Record<string, number> = Object.fromEntries(ALL_SCENES.map((name, i) => [name, i + 1]));

function Scene({ name, flip }: { name: SceneName; flip: boolean }) {
  const { t } = useI18n();
  const base = `business.story.scenes.${name}`;
  const titleId = `scene-${name}-title`;
  return (
    <article
      id={`scene-${name}`}
      aria-labelledby={titleId}
      className={`grid items-center gap-6 lg:grid-cols-2 lg:gap-16 ${SECTION_ANCHOR}`}
    >
      <div className={flip ? "lg:order-2" : undefined}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-full bg-cream-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-berry-dark">
            {t("business.story.step", { n: SCENE_STEP[name], total: TOTAL_SCENES })}
          </span>
          <span className="text-sm font-bold text-berry">{t(`${base}.kicker`)}</span>
        </div>
        <h4 id={titleId} className="mt-3 text-balance text-2xl font-black tracking-tight text-espresso sm:text-3xl">
          {t(`${base}.title`)}
        </h4>
        <p className="mt-3 text-base leading-relaxed text-espresso/70 sm:text-lg">{t(`${base}.body`)}</p>
      </div>
      <figure
        className={`mx-auto w-full max-w-[480px] rounded-[2rem] bg-cream-soft p-3 ring-1 ring-berry/10 ${
          flip ? "lg:order-1" : ""
        }`}
      >
        <LottieScene name={name} label={t(`${base}.alt`)} controlsLabel={t(`${base}.title`)} />
      </figure>
    </article>
  );
}

export function Story() {
  const { t } = useI18n();

  return (
    <section id="story" aria-labelledby="story-title" className={`bg-cream py-20 sm:py-24 ${SECTION_ANCHOR}`}>
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          id="story-title"
          eyebrow={t("business.story.eyebrow")}
          title={t("business.story.title")}
          subtitle={t("business.story.subtitle")}
        />

        {/* The whole process at a glance: every step, linked to its scene. */}
        <nav
          aria-label={t("business.story.eyebrow")}
          className="mx-auto mt-10 max-w-3xl rounded-[2rem] bg-white/70 p-3 ring-1 ring-berry/10 sm:p-5"
        >
          <ol className="sm:columns-2 sm:gap-x-4">
            {ALL_SCENES.map((name) => (
              <li key={name} className="break-inside-avoid">
                <a
                  href={`#scene-${name}`}
                  className={`flex min-h-[44px] items-center gap-3 rounded-2xl px-2 py-1.5 text-left text-sm font-semibold text-espresso transition-colors hover:bg-cream-soft hover:text-berry-dark sm:text-[0.95rem] ${FOCUS_RING}`}
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-soft text-xs font-black text-berry-dark"
                  >
                    {SCENE_STEP[name]}
                  </span>
                  {t(`business.story.scenes.${name}.title`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-28">
          {STORY_ACTS.map((act) => {
            const Icon = ACT_ICONS[act.id];
            return (
              <div key={act.id} id={`act-${act.id}`} className={SECTION_ANCHOR}>
                <div className="flex flex-col items-center gap-4 border-b border-berry/10 pb-8 text-center sm:flex-row sm:items-start sm:text-left">
                  <span
                    aria-hidden
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-berry text-white shadow-lg shadow-berry/20"
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="text-balance text-2xl font-black tracking-tight text-espresso sm:text-3xl">
                      {t(`business.story.acts.${act.id}.title`)}
                    </h3>
                    <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-espresso/70">
                      {t(`business.story.acts.${act.id}.subtitle`)}
                    </p>
                  </div>
                </div>

                <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-20">
                  {(act.scenes as readonly SceneName[]).map((name) => (
                    // Alternate sides across the whole story, not per act.
                    <Scene key={name} name={name} flip={SCENE_STEP[name] % 2 === 0} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
