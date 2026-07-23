"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/translations";
import { fetchSpotTastes, fetchSpotProducts } from "../lib/api";
import { useCart } from "../lib/cart";
import { buildMenuSections } from "../lib/spot-utils";
import type { LocalizedName, MenuItem } from "../lib/types";

function localized(value: LocalizedName | null | undefined, fallback: string, locale: Locale) {
  return (value && value[locale]) || fallback;
}

const priceFmt = (price: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "ua" ? "uk-UA" : locale === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(price);

/**
 * The spot's product menu: tastes + products grouped by type, each with its
 * per-spot price. This is the "select products" step of the ordering flow.
 * (Add-to-cart / quantity is Phase 2 checkout — for now Add is a placeholder.)
 */
export function SpotMenu({ spotId, spotName }: { spotId: string; spotName: string }) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const [sections, setSections] = useState<{ type: string; items: MenuItem[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const qtyOf = (item: MenuItem) =>
    cart.items.find((c) => c.kind === item.kind && c.refId === item.id)?.quantity ?? 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchSpotTastes(spotId), fetchSpotProducts(spotId)])
      .then(([ts, ps]) => {
        if (cancelled) return;
        setSections(buildMenuSections(ts, ps));
      })
      .catch(() => !cancelled && setSections([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  const isEmpty = useMemo(
    () => !loading && sections.length === 0,
    [loading, sections],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-3xl border border-dashed border-berry/20 bg-cream-soft p-8 text-center">
        <div className="text-4xl">🍨</div>
        <p className="mt-3 text-sm text-espresso/60">{t("spot.menu_empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.type}>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-berry">
            {t(`spot.category.${section.type}`)}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex gap-3 rounded-2xl border border-berry/10 bg-white p-3 shadow-sm"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-soft">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">
                      {item.kind === "taste" ? "🍦" : "🥤"}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-semibold text-espresso">
                    {localized(item.titleLocal, item.title, locale)}
                  </p>
                  {item.subtitle && (
                    <p className="truncate text-xs text-espresso/55">{item.subtitle}</p>
                  )}
                  {item.allergens.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-mango">
                      ⚠️ {item.allergens.join(", ")}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-bold text-espresso">
                      {item.isBox ? `${t("spot.from")} ` : ""}
                      {priceFmt(item.price, locale)}
                    </span>
                    {qtyOf(item) > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="−"
                          onClick={() => cart.setQuantity(item.kind, item.id, qtyOf(item) - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-berry/10 font-bold text-berry hover:bg-berry/20"
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-bold text-espresso">{qtyOf(item)}</span>
                        <button
                          type="button"
                          aria-label="+"
                          onClick={() =>
                            cart.add(
                              {
                                kind: item.kind,
                                refId: item.id,
                                spotId,
                                title: localized(item.titleLocal, item.title, locale),
                                imageUrl: item.imageUrl,
                                price: item.price,
                              },
                              spotName,
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-berry font-bold text-white hover:bg-berry-dark"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          cart.add(
                            {
                              kind: item.kind,
                              refId: item.id,
                              spotId,
                              title: localized(item.titleLocal, item.title, locale),
                              imageUrl: item.imageUrl,
                              price: item.price,
                            },
                            spotName,
                          )
                        }
                        className="rounded-full bg-berry/10 px-3.5 py-1.5 text-xs font-semibold text-berry transition-colors hover:bg-berry hover:text-white"
                      >
                        + {t("spot.add")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Floating checkout bar when this spot has items in the cart */}
      {cart.spotId === spotId && cart.count > 0 && (
        <div className="sticky bottom-4 z-40 mx-auto max-w-md">
          <Link
            href="/checkout"
            className="flex items-center justify-between rounded-full bg-berry px-5 py-3.5 text-white shadow-xl shadow-berry/30 transition-transform hover:scale-[1.02]"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/25 px-1.5 text-sm">
                {cart.count}
              </span>
              {t("checkout.go_to_checkout")}
            </span>
            <span className="font-bold">{priceFmt(cart.subtotal, locale)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
