"use client";

import { useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { locales, type Locale } from "../i18n/translations";

const flags: Record<Locale, string> = {
  pl: "🇵🇱",
  en: "🇬🇧",
  ua: "🇺🇦",
};

/** BCP 47 tag of each choice, so screen readers pronounce its name correctly. */
const LANG_TAG: Record<Locale, string> = { pl: "pl", en: "en", ua: "uk" };

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry";

/**
 * Language menu as a plain disclosure: a toggle button with `aria-expanded`
 * and a list of buttons. The menu closes when focus leaves the whole widget
 * (not on a timer), on Escape (focus returns to the toggle) and after a pick.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) toggleRef.current?.focus();
  };

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close(true);
    }
  };

  return (
    <div className="relative" onBlur={onBlur} onKeyDown={onKeyDown}>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full border border-berry/20 bg-white/70 px-3 py-1.5 text-sm font-medium text-espresso transition-colors hover:border-berry/50 hover:bg-white ${FOCUS}`}
        aria-label={`${t("lang.label")}: ${t(`lang.${locale}`)}`}
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className="text-base leading-none" aria-hidden>
          {flags[locale]}
        </span>
        <span className="uppercase" aria-hidden>
          {locale}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          focusable="false"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      <ul
        id={menuId}
        hidden={!open}
        className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-berry/15 bg-white p-1 shadow-xl shadow-berry/10"
      >
        {locales.map((l) => (
          <li key={l}>
            <button
              type="button"
              onClick={() => {
                setLocale(l);
                close(true);
              }}
              aria-current={l === locale ? "true" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-cream-soft ${FOCUS} focus-visible:-outline-offset-2 ${
                l === locale ? "font-semibold text-berry" : "text-espresso"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {flags[l]}
              </span>
              <span lang={LANG_TAG[l]}>{t(`lang.${l}`)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
