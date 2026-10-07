"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/translations";
import { APP_LINKS } from "../lib/site-config";
import { ConeGraphic, ScoopGraphic, SprinkleField } from "./IceCreamGraphics";
import {
  BreadLoafGraphic,
  CakeSliceGraphic,
  CoffeeCupGraphic,
  CroissantGraphic,
  HeroTreatsGraphic,
} from "./TreatGraphics";
import { LoodlyMark } from "./brand/LoodlyMark";
import { PlatformTrio } from "./business/BusinessGraphics";

/*
 * Consumer landing (`/`). Copy lives in `common.json`; wording follows the
 * brand-neutral rule (A4): a single shop is a "lokal" / "location" /
 * "заклад", and per-brand points are explained without a generic brand noun.
 */

/* ---------------------------- shared bits ---------------------------- */

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry";
const FOCUS_ON_DARK =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const BTN_PRIMARY = `inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-berry px-7 py-3 text-center font-semibold text-white shadow-xl shadow-berry/25 transition-transform motion-safe:hover:scale-105 sm:w-auto ${FOCUS}`;
const BTN_SECONDARY = `inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-berry/25 bg-white px-7 py-3 text-center font-semibold text-berry transition-colors hover:border-berry hover:bg-cream-soft sm:w-auto ${FOCUS}`;
const BTN_ON_DARK = `inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-7 py-3 text-center font-bold text-berry shadow-xl transition-transform motion-safe:hover:scale-105 ${FOCUS_ON_DARK}`;

const INTL_LOCALE: Record<Locale, string> = { pl: "pl-PL", en: "en-US", ua: "uk-UA" };

/** Store badges exist only once the store URLs are configured (env, build time). */
const HAS_STORES = Boolean(APP_LINKS.ios || APP_LINKS.android);

// Rendered only when APP_LINKS.download is set, so the QR library is loaded
// on demand instead of shipping with the landing.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

function SectionTitle({
  id,
  title,
  subtitle,
  onDark = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  onDark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2
        id={id}
        className={`text-3xl font-black tracking-tight sm:text-4xl ${onDark ? "text-white" : "text-espresso"}`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-3 text-lg leading-relaxed ${onDark ? "text-white" : "text-espresso/70"}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}

/* Line icons (24×24, stroke = currentColor). Decorative. */
type IconName =
  | "pin"
  | "bag"
  | "coin"
  | "gift"
  | "store"
  | "scooter"
  | "card"
  | "menu"
  | "map"
  | "news"
  | "qr"
  | "sparkles";

const ICON_PATHS: Record<IconName, ReactNode> = {
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7.6 1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4L12 7.6Z" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v8h14v-8M12 8v12" />
      <path d="M12 8c-1.5-3-5-3.6-5-1.3C7 8 9 8 12 8Zm0 0c1.5-3 5-3.6 5-1.3C17 8 15 8 12 8Z" />
    </>
  ),
  store: (
    <>
      <path d="M4 4h16l1 5H3l1-5Z" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  scooter: (
    <>
      <circle cx="6" cy="17.5" r="2.5" />
      <circle cx="18" cy="17.5" r="2.5" />
      <path d="M8.5 17.5h7L14 6.5h3" />
      <rect x="3" y="8.5" width="7" height="6" rx="1" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  menu: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  news: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1Z" />
      <path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2M20 14v.01M18 18h2v2M14 20h.01M16 18v2" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 15.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function CheckBullet({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
        onDark ? "bg-pistachio text-espresso" : "bg-pistachio/25 text-espresso"
      }`}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7 L6 11 L12 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Decorative Code 128–style bars (not a real code). */
const BAR_WIDTHS = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2];
const BARS = (() => {
  let x = 0;
  return BAR_WIDTHS.map((w, i) => {
    const bar = { x, w, dark: i % 2 === 0 };
    x += w;
    return bar;
  });
})();
const BARS_TOTAL = BAR_WIDTHS.reduce((a, b) => a + b, 0);

function BarcodeArt({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${BARS_TOTAL} 20`} preserveAspectRatio="none" className={className} aria-hidden focusable="false">
      {BARS.filter((b) => b.dark).map((b) => (
        <rect key={b.x} x={b.x} y="0" width={b.w} height="20" fill="#3a1526" />
      ))}
    </svg>
  );
}

/* ----------------------------- Hero ----------------------------- */

export function Hero() {
  const { t } = useI18n();
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-cream-soft via-cream to-cream pb-20 pt-28 sm:pt-36"
    >
      {/* Floating background treats */}
      <ScoopGraphic
        className="absolute -left-10 top-32 h-28 w-28 opacity-60 motion-safe:animate-float-slow"
        aria-hidden
      />
      <CroissantGraphic
        className="absolute right-8 top-24 hidden h-16 w-28 opacity-70 motion-safe:animate-float-medium lg:block"
        aria-hidden
      />
      <CoffeeCupGraphic
        className="absolute bottom-10 left-[46%] hidden h-20 w-14 opacity-40 motion-safe:animate-float-slow lg:block"
        aria-hidden
      />
      <SprinkleField className="absolute left-1/3 top-10 h-24 w-24 opacity-60" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
        <div className="text-center motion-safe:animate-fade-up lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-berry/20 bg-white/70 px-4 py-1.5 text-sm font-semibold text-berry">
            <span aria-hidden>✨</span>
            {t("hero.badge")}
          </span>
          <h1
            id="hero-title"
            className="text-balance mt-5 text-4xl font-black leading-[1.08] tracking-tight text-espresso sm:text-5xl xl:text-[3.25rem]"
          >
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-espresso/70 lg:mx-0">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a href="/spots" className={BTN_PRIMARY}>
              {t("hero.cta_find")}
            </a>
            {/* Until the apps are in the stores there is nothing to download, so the
                second CTA explains the flow instead (the first one already opens /spots). */}
            {HAS_STORES ? (
              <a href="#app" className={BTN_SECONDARY}>
                {t("hero.cta_download")}
              </a>
            ) : (
              <a href="#how" className={BTN_SECONDARY}>
                {t("hero.cta_how")}
              </a>
            )}
          </div>
          <p className="mt-6">
            <a
              href="/for-business"
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-md text-sm font-semibold text-berry underline decoration-berry/40 underline-offset-4 transition-colors hover:decoration-berry ${FOCUS}`}
            >
              {t("hero.business_link")}
              <span aria-hidden>→</span>
            </a>
          </p>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-strawberry/20 blur-3xl sm:h-96 sm:w-96" aria-hidden />
          <HeroTreatsGraphic
            className="relative w-full max-w-[20rem] drop-shadow-2xl motion-safe:animate-float-medium sm:max-w-[26rem]"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Categories --------------------------- */

const CATEGORIES: {
  key: "icecream" | "bakery" | "cafe" | "confectionery";
  Graphic: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { key: "icecream", Graphic: ConeGraphic },
  { key: "bakery", Graphic: BreadLoafGraphic },
  { key: "cafe", Graphic: CoffeeCupGraphic },
  { key: "confectionery", Graphic: CakeSliceGraphic },
];

export function Categories() {
  const { t } = useI18n();
  return (
    <section id="categories" aria-labelledby="categories-title" className="scroll-mt-20 bg-berry py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle id="categories-title" title={t("categories.title")} subtitle={t("categories.subtitle")} onDark />
        <ul className="mt-12 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {CATEGORIES.map(({ key, Graphic }) => (
            <li
              key={key}
              className="flex flex-col items-center rounded-3xl bg-white p-5 text-center shadow-lg shadow-berry-dark/20 sm:p-6"
            >
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-cream-soft" aria-hidden>
                <Graphic className="h-16 w-16" />
              </span>
              <h3 className="mt-4 text-base font-bold text-espresso [overflow-wrap:anywhere] sm:text-lg">
                {t(`categories.${key}.name`)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-espresso/70">{t(`categories.${key}.desc`)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <a href="/spots" className={BTN_ON_DARK}>
            {t("categories.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------- How it works -------------------------- */

export function HowItWorks() {
  const { t } = useI18n();
  const steps: { key: string; icon: IconName }[] = [
    { key: "step1", icon: "pin" },
    { key: "step2", icon: "bag" },
    { key: "step3", icon: "coin" },
    { key: "step4", icon: "gift" },
  ];
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle id="how-title" title={t("how.title")} subtitle={t("how.subtitle")} />
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((s, i) => (
            <li key={s.key} className="relative text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-berry shadow-lg shadow-berry/10 ring-4 ring-cream-soft">
                <Icon name={s.icon} className="h-9 w-9" />
              </div>
              <div
                className="mx-auto mt-4 flex h-7 w-7 items-center justify-center rounded-full bg-berry text-sm font-bold text-white"
                aria-hidden
              >
                {i + 1}
              </div>
              <h3 className="mt-3 text-lg font-bold text-espresso">{t(`how.${s.key}.title`)}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-espresso/70">
                {t(`how.${s.key}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------- Loyalty ---------------------------- */

/**
 * Example app screen: three separate balances (one per logo, names shown as
 * skeleton bars — no invented brands) and the single card with its code.
 * Real HTML, so the text is localized; the whole mock is one image for
 * assistive tech (see `loyalty.mock_alt`).
 */
function PointsWalletMock() {
  const { t, locale } = useI18n();
  const fmt = new Intl.NumberFormat(INTL_LOCALE[locale]);
  const rows: { Graphic: ComponentType<SVGProps<SVGSVGElement>>; n: number }[] = [
    { Graphic: CoffeeCupGraphic, n: 1250 },
    { Graphic: CroissantGraphic, n: 380 },
    { Graphic: ConeGraphic, n: 95 },
  ];
  return (
    <div className="relative w-[17rem] rounded-[2.5rem] border-8 border-espresso-dark bg-cream p-3 shadow-2xl ring-1 ring-white/15 sm:w-72">
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-espresso/20" />
      <div className="rounded-[1.5rem] bg-cream-soft p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-black text-espresso">{t("loyalty.mock_title")}</span>
          <LoodlyMark className="h-7 w-5" />
        </div>
        <ul className="mt-3 space-y-2">
          {rows.map(({ Graphic, n }) => (
            <li key={n} className="flex items-center gap-2 rounded-2xl bg-white p-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-deep">
                <Graphic className="h-7 w-7" />
              </span>
              <span className="h-3 min-w-0 max-w-[6rem] flex-1 rounded-full bg-espresso/15" />
              <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-cream-soft px-2 py-1 text-[11px] font-bold text-espresso">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-mango">
                  <span className="h-1.5 w-1.5 rounded-full border border-cream" />
                </span>
                {t("loyalty.mock_points", { count: n, n: fmt.format(n) })}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-2xl bg-white p-3">
          <p className="text-xs font-bold text-espresso">{t("loyalty.mock_card")}</p>
          <BarcodeArt className="mt-2 h-12 w-full" />
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-cream-deep p-1 text-[10px] font-semibold sm:text-[11px]">
            <span className="whitespace-nowrap rounded-full px-1.5 py-1 text-center text-espresso/75">{t("loyalty.mock_qr")}</span>
            <span className="whitespace-nowrap rounded-full bg-berry px-1.5 py-1 text-center text-white">
              {t("loyalty.mock_barcode")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Loyalty() {
  const { t } = useI18n();
  const rules: { key: "r1" | "r2" | "r3"; icon: IconName }[] = [
    { key: "r1", icon: "store" },
    { key: "r2", icon: "qr" },
    { key: "r3", icon: "sparkles" },
  ];
  return (
    <section
      id="loyalty"
      aria-labelledby="loyalty-title"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-berry-dark to-espresso py-20 sm:py-24"
    >
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
            <span aria-hidden>💳</span>
            {t("loyalty.badge")}
          </span>
          <h2 id="loyalty-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t("loyalty.title")}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">{t("loyalty.lead")}</p>
          <ul className="mt-8 space-y-6">
            {rules.map((r) => (
              <li key={r.key} className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-mango">
                  <Icon name={r.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{t(`loyalty.${r.key}_title`)}</h3>
                  <p className="mt-1 leading-relaxed text-white/80">{t(`loyalty.${r.key}_body`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <a href="#rewards" className={`mt-9 w-full sm:w-auto ${BTN_ON_DARK}`}>
            {t("loyalty.cta")}
          </a>
        </div>

        <figure className="flex flex-col items-center">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto h-72 w-72 rounded-full bg-strawberry/25 blur-3xl" aria-hidden />
            <div role="img" aria-label={t("loyalty.mock_alt")} className="relative">
              <PointsWalletMock />
            </div>
          </div>
          <figcaption className="mt-5 text-sm font-medium text-white/80">{t("loyalty.mock_caption")}</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* --------------------------- Features --------------------------- */

export function Features() {
  const { t } = useI18n();
  const items: { key: string; icon: IconName }[] = [
    { key: "pickup", icon: "bag" },
    { key: "delivery", icon: "scooter" },
    { key: "pay", icon: "card" },
    { key: "menu", icon: "menu" },
    { key: "map", icon: "map" },
    { key: "news", icon: "news" },
  ];
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle id="features-title" title={t("features.title")} subtitle={t("features.subtitle")} />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <li
              key={f.key}
              className="group rounded-3xl border border-berry/10 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-berry/10 motion-safe:hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-soft text-berry transition-transform motion-safe:group-hover:scale-110">
                <Icon name={f.icon} className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-espresso">{t(`features.${f.key}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-espresso/70">{t(`features.${f.key}.description`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------- App CTA ---------------------------- */

function StoreBadge({ store, href, label }: { store: "ios" | "android"; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex min-h-[48px] items-center gap-3 rounded-2xl bg-espresso px-5 py-2.5 text-white transition-transform motion-safe:hover:scale-105 ${FOCUS}`}
    >
      <span className="text-2xl" aria-hidden>
        {store === "ios" ? "" : "▶"}
      </span>
      <span className="text-left">
        <span className="block text-[11px] uppercase tracking-wide text-white/80">
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
    <section id="app" aria-labelledby="app-title" className="scroll-mt-20 bg-cream-soft py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <h2 id="app-title" className="text-3xl font-black tracking-tight text-espresso sm:text-4xl">
            {t("app.title")}
          </h2>
          <p className="mt-3 text-lg text-espresso/70">{t("app.subtitle")}</p>
          <ul className="mt-7 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckBullet />
                <span className="text-espresso/80">{t(`app.${p}`)}</span>
              </li>
            ))}
          </ul>
          {HAS_STORES ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {APP_LINKS.ios ? <StoreBadge store="ios" href={APP_LINKS.ios} label={t("app.ios")} /> : null}
              {APP_LINKS.android ? (
                <StoreBadge store="android" href={APP_LINKS.android} label={t("app.android")} />
              ) : null}
            </div>
          ) : (
            <div className="mt-8">
              <a href="/spots" className={BTN_PRIMARY}>
                {t("app.web_cta")}
              </a>
              <p className="mt-3 text-sm text-espresso/70">{t("app.web_hint")}</p>
            </div>
          )}
        </div>

        {/* Phone mock-up (decorative) */}
        <div className="relative flex justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-berry/15 blur-3xl" aria-hidden />
          <div
            className="relative w-64 rounded-[2.5rem] border-8 border-espresso bg-cream p-3 shadow-2xl"
            aria-hidden
          >
            <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-espresso/20" />
            <div className="rounded-[1.5rem] bg-gradient-to-b from-cream-soft to-cream p-4">
              <div className="flex items-center gap-2">
                <LoodlyMark className="h-8 w-6" />
                <span className="text-lg font-black text-berry">Loodly</span>
              </div>
              <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs font-bold text-espresso">{t("app.mock_title")}</p>
                <div className="mt-3 space-y-2.5">
                  {[CroissantGraphic, CoffeeCupGraphic].map((Graphic, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-soft">
                        <Graphic className="h-6 w-6" />
                      </span>
                      <span className={`h-2.5 rounded-full bg-espresso/15 ${i === 0 ? "w-24" : "w-16"}`} />
                    </div>
                  ))}
                </div>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pistachio px-3 py-1 text-[11px] font-bold text-espresso">
                  <span className="h-1.5 w-1.5 rounded-full bg-espresso" />
                  {t("app.mock_status")}
                </span>
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

          {APP_LINKS.download ? (
            <figure className="absolute -bottom-6 -right-2 hidden rounded-2xl bg-white p-3 shadow-xl sm:block">
              <QRCodeSVG value={APP_LINKS.download} size={80} level="M" fgColor="#3a1526" bgColor="#ffffff" aria-hidden />
              <figcaption className="mt-1.5 max-w-[5rem] text-center text-xs font-medium text-espresso/75">
                {t("app.qr_hint")}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Business teaser ------------------------- */

export function Teaser() {
  const { t } = useI18n();
  return (
    <section id="business" aria-labelledby="teaser-title" className="scroll-mt-20 bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[2rem] bg-espresso-dark p-8 sm:p-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-berry/25 blur-3xl" aria-hidden />
          <div className="relative">
            <h2 id="teaser-title" className="text-balance text-2xl font-black tracking-tight text-white sm:text-3xl">
              {t("teaser.title")}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-cream/80">{t("teaser.body")}</p>
            <a href="/for-business" className={`mt-8 w-full sm:w-auto ${BTN_ON_DARK}`}>
              {t("teaser.cta")}
              <span aria-hidden className="ml-2">
                →
              </span>
            </a>
          </div>
          <div className="relative hidden lg:block">
            <div className="rounded-[1.5rem] bg-cream-soft p-4">
              <PlatformTrio className="h-auto w-full" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Bottom CTA --------------------------- */

export function BottomCta() {
  const { t } = useI18n();
  return (
    <section
      aria-labelledby="bottom-cta-title"
      className="relative overflow-hidden bg-gradient-to-br from-berry to-berry-dark py-20 sm:py-24"
    >
      <CroissantGraphic className="absolute -left-6 bottom-6 hidden h-24 w-40 opacity-40 sm:block" aria-hidden />
      <ScoopGraphic
        className="absolute right-8 top-10 hidden h-24 w-24 opacity-40 motion-safe:animate-float-slow sm:block"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 id="bottom-cta-title" className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {t("cta.ready")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white">{t(HAS_STORES ? "cta.subtitle" : "cta.subtitle_web")}</p>
        <a href={HAS_STORES ? "#app" : "/spots"} className={`mt-8 ${BTN_ON_DARK}`}>
          {t(HAS_STORES ? "cta.download_now" : "app.web_cta")}
        </a>
      </div>
    </section>
  );
}

/* ----------------------------- Footer ----------------------------- */

// The footer lives in `./Footer` (shared by every page). Re-exported so
// existing `import { Footer } from "./LandingSections"` keep working.
export { Footer } from "./Footer";
