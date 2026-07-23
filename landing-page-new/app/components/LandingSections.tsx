"use client";

import { useI18n } from "../i18n/I18nProvider";
import {
  ConeGraphic,
  PopsicleGraphic,
  ScoopGraphic,
  SundaeGraphic,
  SprinkleField,
} from "./IceCreamGraphics";

/* ----------------------------- Hero ----------------------------- */

export function Hero() {
  const { t } = useI18n();
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-cream-soft via-cream to-cream pt-28 pb-20 sm:pt-36"
    >
      {/* Floating background scoops */}
      <ScoopGraphic className="absolute -left-10 top-32 h-28 w-28 animate-float-slow opacity-70" aria-hidden />
      <PopsicleGraphic className="absolute right-6 top-24 hidden h-40 animate-float-medium opacity-80 lg:block" aria-hidden />
      <SprinkleField className="absolute left-1/3 top-10 h-24 w-24 opacity-60" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
        <div className="animate-fade-up text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-berry/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-berry">
            <span aria-hidden>✨</span>
            {t("hero.badge")}
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-espresso sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-espresso/70 lg:mx-0">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="/spots"
              className="w-full rounded-full bg-berry px-7 py-3.5 text-center font-semibold text-white shadow-xl shadow-berry/25 transition-transform hover:scale-105 sm:w-auto"
            >
              {t("hero.cta_order")}
            </a>
            <a
              href="#app"
              className="w-full rounded-full border-2 border-berry/25 bg-white px-7 py-3.5 text-center font-semibold text-berry transition-colors hover:border-berry hover:bg-cream-soft sm:w-auto"
            >
              {t("hero.cta_download")}
            </a>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-strawberry/20 blur-3xl sm:h-96 sm:w-96" aria-hidden />
          <ConeGraphic className="relative h-80 animate-float-medium drop-shadow-2xl sm:h-[26rem]" aria-hidden />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Stats ----------------------------- */

export function Stats() {
  const { t } = useI18n();
  const stats = [
    { value: "120+", label: t("stats.flavors") },
    { value: "36", label: t("stats.spots") },
    { value: "45", label: t("stats.delivery") },
    { value: "500k+", label: t("stats.users") },
  ];
  return (
    <section className="bg-berry py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-black text-white sm:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm font-medium text-white/75">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- Features --------------------------- */

const featureIcons = ["🌿", "🌱", "🚴", "🎁", "📍", "⚖️"];

export function Features() {
  const { t } = useI18n();
  const keys = ["natural", "vegan", "fast", "loyalty", "tracking", "quality"];
  return (
    <section id="features" className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-espresso sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-3 text-lg text-espresso/65">{t("features.subtitle")}</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((k, i) => (
            <div
              key={k}
              className="group rounded-3xl border border-berry/10 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-berry/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-soft text-2xl transition-transform group-hover:scale-110">
                <span aria-hidden>{featureIcons[i]}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-espresso">
                {t(`features.${k}.title`)}
              </h3>
              <p className="mt-2 leading-relaxed text-espresso/65">
                {t(`features.${k}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------- Flavor of day -------------------------- */

export function FlavorOfDay() {
  const { t } = useI18n();
  return (
    <section className="bg-gradient-to-br from-berry to-berry-dark py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
        <div className="relative flex justify-center">
          <div className="absolute h-64 w-64 rounded-full bg-strawberry/30 blur-3xl" aria-hidden />
          <SundaeGraphic className="relative h-72 animate-float-slow drop-shadow-2xl" aria-hidden />
        </div>
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white">
            <span aria-hidden>🍨</span>
            {t("flavor.badge")}
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t("flavor.title")}
          </h2>
          <p className="mt-4 text-2xl font-bold text-cream-deep">{t("flavor.name")}</p>
          <p className="mx-auto mt-3 max-w-lg text-lg leading-relaxed text-white/80 lg:mx-0">
            {t("flavor.description")}
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="/spots"
              className="w-full rounded-full bg-white px-6 py-3 text-center font-semibold text-berry transition-transform hover:scale-105 sm:w-auto"
            >
              {t("flavor.cta_taste")}
            </a>
            <a
              href="/spots"
              className="w-full rounded-full border-2 border-white/40 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              {t("flavor.cta_order")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------- How it works -------------------------- */

export function HowItWorks() {
  const { t } = useI18n();
  const steps = ["step1", "step2", "step3", "step4"];
  const emojis = ["📱", "📦", "🚴", "🚪"];
  return (
    <section id="how" className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-espresso sm:text-4xl">
            {t("how.title")}
          </h2>
          <p className="mt-3 text-lg text-espresso/65">{t("how.subtitle")}</p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s} className="relative text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl shadow-lg shadow-berry/10 ring-4 ring-cream-soft">
                <span aria-hidden>{emojis[i]}</span>
              </div>
              <div className="mx-auto mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-berry text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-3 text-lg font-bold text-espresso">
                {t(`how.${s}.title`)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-espresso/65">
                {t(`how.${s}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- App CTA ---------------------------- */

function StoreBadge({ store, label }: { store: "ios" | "android"; label: string }) {
  return (
    <a
      href="#"
      className="flex items-center gap-3 rounded-2xl bg-espresso px-5 py-2.5 text-white transition-transform hover:scale-105"
    >
      <span className="text-2xl" aria-hidden>
        {store === "ios" ? "" : "▶"}
      </span>
      <span className="text-left">
        <span className="block text-[10px] uppercase tracking-wide text-white/60">
          {store === "ios" ? "App Store" : "Google Play"}
        </span>
        <span className="block text-sm font-semibold leading-tight">{label}</span>
      </span>
    </a>
  );
}

export function AppSection() {
  const { t } = useI18n();
  const points = ["point1", "point2", "point3", "point4"];
  return (
    <section id="app" className="bg-cream-soft py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-espresso sm:text-4xl">
            {t("app.title")}
          </h2>
          <p className="mt-3 text-lg text-espresso/65">{t("app.subtitle")}</p>
          <ul className="mt-7 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pistachio/20 text-pistachio">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7 L6 11 L12 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-espresso/80">{t(`app.${p}`)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <StoreBadge store="ios" label={t("app.ios")} />
            <StoreBadge store="android" label={t("app.android")} />
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative flex justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-berry/15 blur-3xl" aria-hidden />
          <div className="relative w-64 rounded-[2.5rem] border-8 border-espresso bg-cream p-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-espresso/20" />
            <div className="rounded-[1.5rem] bg-gradient-to-b from-cream-soft to-cream p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-berry">Gelato</span>
                <span className="text-xl" aria-hidden>🍦</span>
              </div>
              <div className="mt-4 flex justify-center">
                <ConeGraphic className="h-36" aria-hidden />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-3/4 rounded-full bg-berry/15" />
                <div className="h-3 w-1/2 rounded-full bg-berry/10" />
              </div>
              <div className="mt-4 rounded-2xl bg-berry py-2.5 text-center text-sm font-semibold text-white">
                {t("hero.cta_order")}
              </div>
            </div>
          </div>

          {/* QR code */}
          <div className="absolute -bottom-6 -right-2 hidden rounded-2xl bg-white p-3 shadow-xl sm:block">
            <QrPlaceholder />
            <p className="mt-1.5 text-center text-[10px] font-medium text-espresso/60">
              {t("app.qr_hint")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function QrPlaceholder() {
  // Decorative QR-style grid.
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1,
    1, 0, 1, 0, 0, 1, 0, 1,
    1, 1, 1, 0, 1, 1, 1, 0,
    0, 0, 0, 1, 0, 0, 1, 1,
    1, 0, 1, 1, 1, 0, 1, 0,
    1, 1, 0, 0, 1, 1, 0, 1,
    0, 1, 1, 0, 1, 0, 1, 1,
    1, 0, 1, 1, 0, 1, 0, 1,
  ];
  return (
    <div className="grid h-20 w-20 grid-cols-8 gap-px">
      {cells.map((c, i) => (
        <div key={i} className={c ? "bg-espresso" : "bg-transparent"} />
      ))}
    </div>
  );
}

/* --------------------------- Bottom CTA --------------------------- */

export function BottomCta() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-strawberry to-berry py-20 sm:py-24">
      <PopsicleGraphic className="absolute -left-6 bottom-0 hidden h-48 opacity-40 sm:block" aria-hidden />
      <ScoopGraphic className="absolute right-8 top-10 h-24 w-24 animate-float-slow opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {t("cta.ready")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">{t("cta.subtitle")}</p>
        <a
          href="#app"
          className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-bold text-berry shadow-xl transition-transform hover:scale-105"
        >
          {t("cta.download_now")}
        </a>
      </div>
    </section>
  );
}

/* ----------------------------- Footer ----------------------------- */

export function Footer() {
  const { t } = useI18n();
  return (
    <footer id="contact" className="bg-espresso-dark py-14 text-cream/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🍦</span>
            <span className="text-xl font-black text-white">Gelato</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/60">
            {t("footer.tagline")}
          </p>
          <div className="mt-5 flex gap-3">
            {["Facebook", "Instagram", "TikTok"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-berry"
              >
                <span className="text-xs font-bold">{s[0]}</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">
            {t("footer.company")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="#" className="transition-colors hover:text-white">{t("footer.about")}</a></li>
            <li><a href="#" className="transition-colors hover:text-white">{t("footer.contact")}</a></li>
            <li><a href="#" className="transition-colors hover:text-white">{t("footer.careers")}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">
            {t("footer.legal")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="#" className="transition-colors hover:text-white">{t("footer.privacy")}</a></li>
            <li><a href="#" className="transition-colors hover:text-white">{t("footer.terms")}</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 px-5 pt-6 text-sm text-cream/50 sm:flex-row">
        <span>{t("footer.copyright")}</span>
        <span>{t("footer.made")}</span>
      </div>
    </footer>
  );
}
