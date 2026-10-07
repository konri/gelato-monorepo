"use client";

import { useI18n } from "../i18n/I18nProvider";
import { BUSINESS_CONTACT, SOCIAL_LINKS } from "../lib/site-config";

/*
 * Site footer, shared by every page. Kept in its own module so pages other
 * than `/` (and the not-found boundary, which ships with every route) do not
 * pull in the whole consumer landing (`LandingSections.tsx`).
 */

const FOCUS_ON_DARK =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const SOCIALS: { key: keyof typeof SOCIAL_LINKS; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
];

function MailIcon({ className }: { className?: string }) {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function Footer() {
  const { t } = useI18n();
  const socials = SOCIALS.filter((s) => SOCIAL_LINKS[s.key] !== "");
  const email: string = BUSINESS_CONTACT.email;
  const linkClass = `inline-flex min-h-[44px] items-center rounded-md transition-colors hover:text-white ${FOCUS_ON_DARK}`;
  return (
    <footer id="contact" className="bg-espresso-dark py-14 text-cream/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <a href="/" className={`inline-flex rounded-2xl bg-cream px-3 py-2 ${FOCUS_ON_DARK}`} aria-label="Loodly">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/loodly-logo.svg" alt="Loodly" className="h-10 w-auto" />
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/60">{t("footer.tagline")}</p>
          {socials.length > 0 ? (
            <ul className="mt-5 flex gap-3">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={SOCIAL_LINKS[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-berry ${FOCUS_ON_DARK}`}
                  >
                    <span className="text-xs font-bold" aria-hidden>
                      {s.label[0]}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">{t("footer.company")}</h2>
          <ul className="mt-3 text-sm">
            <li>
              <a href="/for-business" className={linkClass}>
                {t("footer.business")}
              </a>
            </li>
            <li>
              <a href="/spots" className={linkClass}>
                {t("nav.spots")}
              </a>
            </li>
            {email ? (
              <li>
                <a href={`mailto:${email}`} className={`${linkClass} gap-2`}>
                  <MailIcon className="h-4 w-4" />
                  {t("footer.email_label")}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">{t("footer.legal")}</h2>
          <ul className="mt-3 text-sm">
            <li>
              <a href="/policy" className={linkClass}>
                {t("footer.privacy")}
              </a>
            </li>
            <li>
              <a href="/terms" className={linkClass}>
                {t("footer.terms")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 px-5 pt-6 text-sm text-cream/60 sm:flex-row">
        <span>{t("footer.copyright")}</span>
        <span>{t("footer.made")}</span>
      </div>
    </footer>
  );
}
