"use client";

import { useI18n } from "../../../i18n/I18nProvider";
import { IntegrationDiagram } from "../BusinessGraphics";
import { CheckBadge, IconDevices } from "../BizIcons";
import { SECTION_ANCHOR, SectionHeading } from "../ui";

const POINTS = ["p1", "p2", "p3"] as const;
const NODES = ["node_system", "node_loodly", "node_spots"] as const;

export function Integration() {
  const { t } = useI18n();
  return (
    <section
      id="integration"
      aria-labelledby="integration-title"
      className={`relative overflow-hidden bg-espresso-dark py-20 sm:py-24 ${SECTION_ANCHOR}`}
    >
      <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-berry/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <SectionHeading
            id="integration-title"
            tone="dark"
            align="left"
            eyebrow={t("business.integration.eyebrow")}
            title={t("business.integration.title")}
          />
          <p className="mt-4 text-lg leading-relaxed text-white/80">{t("business.integration.body")}</p>
          <ul className="mt-7 space-y-3.5">
            {POINTS.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <CheckBadge className="mt-0.5" />
                <span className="leading-relaxed text-white">{t(`business.integration.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <figure className="rounded-[2rem] bg-white/5 p-5 ring-1 ring-white/10 sm:p-7">
            <IntegrationDiagram role="img" aria-label={t("business.integration.diagram_alt")} className="h-auto w-full" />
            {/* Labels are HTML (not SVG text) so they wrap, translate and scale. */}
            <figcaption className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold leading-snug text-white/80 sm:text-sm">
              {NODES.map((key) => (
                <span key={key} className={key === "node_loodly" ? "text-white" : undefined}>
                  {t(`business.integration.${key}`)}
                </span>
              ))}
            </figcaption>
          </figure>

          <div className="mt-6 flex items-start gap-4 rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-mango">
              <IconDevices className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">{t("business.integration.hardware_title")}</h3>
              <p className="mt-1.5 leading-relaxed text-white/80">{t("business.integration.hardware_body")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
