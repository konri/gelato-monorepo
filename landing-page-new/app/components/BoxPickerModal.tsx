"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/translations";
import { fetchSpotTastes } from "../lib/api";
import type { BoxSelection } from "../lib/cart";
import type { LocalizedName, MenuItem, Taste } from "../lib/types";

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
  /** The box product being configured (null = closed). */
  box: MenuItem | null;
  onClose: () => void;
  onConfirm: (selections: BoxSelection[]) => void;
};

/**
 * Pick the tastes for a box product. Total picked scoops are capped at
 * box.maxTastes; a taste can be chosen more than once. Mirrors the mobile
 * BoxPickerModal.
 */
export function BoxPickerModal({ box, onClose, onConfirm }: Props) {
  const { t, locale } = useI18n();
  const [tastes, setTastes] = useState<Taste[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<Record<string, number>>({});

  const max = box?.maxTastes ?? 0;
  const total = useMemo(() => Object.values(picked).reduce((s, n) => s + n, 0), [picked]);
  const remaining = max - total;

  // Load this spot's tastes when the modal opens; reset selection each time.
  useEffect(() => {
    if (!box) return;
    let cancelled = false;
    setLoading(true);
    setPicked({});
    fetchSpotTastes(box.spotId)
      .then((ts) => !cancelled && setTastes(ts.filter((tt) => tt.isAvailable)))
      .catch(() => !cancelled && setTastes([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [box]);

  // Close on Escape.
  useEffect(() => {
    if (!box) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [box, onClose]);

  if (!box) return null;

  const inc = (id: string) => {
    if (remaining <= 0) return;
    setPicked((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  };
  const dec = (id: string) =>
    setPicked((p) => {
      const next = { ...p };
      const v = (next[id] ?? 0) - 1;
      if (v <= 0) delete next[id];
      else next[id] = v;
      return next;
    });

  const confirm = () => {
    const selections: BoxSelection[] = tastes
      .filter((tt) => picked[tt.id])
      .map((tt) => ({
        tasteId: tt.id,
        title: localized(tt.titleLocal, tt.title, locale),
        quantity: picked[tt.id],
      }));
    onConfirm(selections);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={localized(box.titleLocal, box.title, locale)}
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-berry/10 px-5 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black text-espresso">
              {localized(box.titleLocal, box.title, locale)}
            </h2>
            <p className="mt-0.5 text-xs text-espresso/70">{t("spot.box_pick_up_to", { max })}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("spot.close")}
            className="shrink-0 rounded-full p-1.5 text-espresso/70 transition-colors hover:bg-cream-soft hover:text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Remaining counter */}
        <div className="bg-cream-soft px-5 py-2">
          <p className="text-sm font-semibold text-espresso">
            {remaining > 0 ? t("spot.box_remaining", { count: remaining }) : t("spot.box_full")}
          </p>
        </div>

        {/* Taste list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {tastes.length === 0 ? (
              <p className="py-10 text-center text-sm text-espresso/70">{t("spot.menu_empty")}</p>
            ) : (
              tastes.map((tt) => {
                const qty = picked[tt.id] ?? 0;
                const title = localized(tt.titleLocal, tt.title, locale);
                return (
                  <div
                    key={tt.id}
                    className="mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-berry/10 bg-white p-2"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-soft">
                      {tt.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tt.imageUrl} alt={title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🍦</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-espresso">{title}</p>
                      {tt.subtitle && (
                        <p className="truncate text-xs text-espresso/70">{tt.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pr-1">
                      {qty > 0 && (
                        <>
                          <button
                            type="button"
                            aria-label="−"
                            onClick={() => dec(tt.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-berry/10 font-bold text-berry hover:bg-berry/20"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold text-espresso">{qty}</span>
                        </>
                      )}
                      <button
                        type="button"
                        aria-label="+"
                        onClick={() => inc(tt.id)}
                        disabled={remaining <= 0}
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${
                          remaining <= 0 ? "cursor-not-allowed bg-espresso/20" : "bg-berry hover:bg-berry-dark"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Confirm */}
        <div className="border-t border-berry/10 p-4">
          <button
            type="button"
            disabled={total === 0}
            onClick={confirm}
            className={`w-full rounded-full py-3.5 font-semibold text-white transition-transform ${
              total === 0 ? "cursor-not-allowed bg-espresso/20" : "bg-berry hover:scale-[1.02]"
            }`}
          >
            {t("spot.box_add", { count: total })} · {priceFmt(box.price, locale)}
          </button>
        </div>
      </div>
    </div>
  );
}
