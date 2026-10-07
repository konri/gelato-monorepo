"use client";

import { useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/translations";
import type { LocalizedName, MenuItem } from "../lib/types";
import { LoodlyMark } from "./brand/LoodlyMark";

function localized(value: LocalizedName | null | undefined, fallback: string, locale: Locale) {
  return (value && value[locale]) || fallback;
}

const priceFmt = (price: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "ua" ? "uk-UA" : locale === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(price);

type Props = {
  item: MenuItem | null;
  quantity: number;
  onClose: () => void;
  /** Add one / configure box. For boxes this should open the box picker. */
  onAdd: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
};

/**
 * Read-only details for a menu item, opened by tapping its image or title.
 * Boxes show a "choose scoops" CTA (delegated to the caller) instead of a
 * plain add, since they need a taste selection.
 */
export function MenuItemDetailModal({ item, quantity, onClose, onAdd, onDecrement }: Props) {
  const { t, locale } = useI18n();

  // Close on Escape.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  const title = localized(item.titleLocal, item.title, locale);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Cover */}
        <div className="relative h-48 w-full bg-cream-soft">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">
              {item.kind === "taste" ? <span aria-hidden>🍦</span> : <LoodlyMark className="h-20 w-20" />}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("spot.close")}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-espresso shadow-md transition-colors hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-black text-espresso">{title}</h2>
          {item.subtitle && <p className="mt-0.5 text-sm text-espresso/70">{item.subtitle}</p>}

          <p className="mt-3 text-sm leading-relaxed text-espresso/75">
            {item.description || t("spot.no_description")}
          </p>

          {item.kcalPerPortion != null && (
            <p className="mt-3 text-xs font-semibold text-espresso/70">
              🔥 {t("spot.calories", { count: item.kcalPerPortion })}
            </p>
          )}

          {item.allergens.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-mango-dark">
                {t("spot.ingredients")}
              </p>
              <p className="mt-1 text-sm text-espresso/70">⚠️ {item.allergens.join(", ")}</p>
            </div>
          )}

          {/* Price + actions */}
          <div className="mt-5 flex items-center justify-between border-t border-berry/10 pt-4">
            <span className="text-lg font-black text-espresso">
              {item.isBox ? `${t("spot.from")} ` : ""}
              {priceFmt(item.price, locale)}
            </span>

            {item.isBox ? (
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                {t("spot.box_configure")}
              </button>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="−"
                  onClick={() => onDecrement(item)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-berry/10 text-lg font-bold text-berry hover:bg-berry/20"
                >
                  −
                </button>
                <span className="w-6 text-center text-lg font-bold text-espresso">{quantity}</span>
                <button
                  type="button"
                  aria-label="+"
                  onClick={() => onAdd(item)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-berry text-lg font-bold text-white hover:bg-berry-dark"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                + {t("spot.add")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
