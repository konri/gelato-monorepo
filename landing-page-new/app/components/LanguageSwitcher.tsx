"use client";

import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { locales, type Locale } from "../i18n/translations";

const flags: Record<Locale, string> = {
  pl: "🇵🇱",
  en: "🇬🇧",
  ua: "🇺🇦",
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-2 rounded-full border border-berry/20 bg-white/70 px-3 py-1.5 text-sm font-medium text-espresso transition-colors hover:border-berry/50 hover:bg-white"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{flags[locale]}</span>
        <span className="uppercase">{locale}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <ul
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-berry/15 bg-white shadow-xl shadow-berry/10"
          role="listbox"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream-soft ${
                  l === locale ? "font-semibold text-berry" : "text-espresso"
                }`}
                role="option"
                aria-selected={l === locale}
              >
                <span className="text-base leading-none">{flags[l]}</span>
                {t(`lang.${l}`)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
