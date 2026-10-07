"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/translations";
import { fetchSpotTastes, fetchSpotProducts } from "../lib/api";
import { useCart, type BoxSelection } from "../lib/cart";
import { buildMenuSections } from "../lib/spot-utils";
import type { LocalizedName, MenuItem } from "../lib/types";
import { MenuItemDetailModal } from "./MenuItemDetailModal";
import { BoxPickerModal } from "./BoxPickerModal";
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
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [boxItem, setBoxItem] = useState<MenuItem | null>(null);

  // Boxes live on their own cart lines, so their menu-row quantity is the sum
  // across every configured box of that product; non-box items have one line.
  const qtyOf = (item: MenuItem) =>
    cart.items
      .filter((c) => c.kind === item.kind && c.refId === item.id)
      .reduce((s, c) => s + c.quantity, 0);

  const addToCart = (item: MenuItem) =>
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
    );

  // Adding a box opens the taste picker; everything else adds straight to cart.
  const handleAdd = (item: MenuItem) => {
    if (item.isBox) {
      setDetailItem(null);
      setBoxItem(item);
    } else {
      addToCart(item);
    }
  };

  const confirmBox = (selections: BoxSelection[]) => {
    if (!boxItem) return;
    cart.addBox(
      {
        kind: boxItem.kind,
        refId: boxItem.id,
        spotId,
        title: localized(boxItem.titleLocal, boxItem.title, locale),
        imageUrl: boxItem.imageUrl,
        price: boxItem.price,
        boxSelections: selections,
      },
      spotName,
    );
    setBoxItem(null);
  };

  const decrement = (item: MenuItem) => cart.setQuantity(item.kind, item.id, qtyOf(item) - 1);

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
        <LoodlyMark className="mx-auto h-12 w-12" />
        <p className="mt-3 text-sm text-espresso/65">{t("spot.menu_empty")}</p>
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
                <button
                  type="button"
                  onClick={() => setDetailItem(item)}
                  aria-label={t("spot.details")}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-soft transition-transform hover:scale-105"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">
                      {item.kind === "taste" ? <span aria-hidden>🍦</span> : <LoodlyMark className="h-10 w-10" />}
                    </div>
                  )}
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <button
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="text-left font-semibold text-espresso hover:text-berry"
                  >
                    {localized(item.titleLocal, item.title, locale)}
                  </button>
                  {item.subtitle && (
                    <p className="truncate text-xs text-espresso/70">{item.subtitle}</p>
                  )}
                  {item.allergens.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-mango-dark">
                      ⚠️ {item.allergens.join(", ")}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-bold text-espresso">
                      {item.isBox ? `${t("spot.from")} ` : ""}
                      {priceFmt(item.price, locale)}
                    </span>
                    {/* Boxes always route through the picker; non-box items get
                        an inline quantity stepper once in the cart. */}
                    {!item.isBox && qtyOf(item) > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="−"
                          onClick={() => decrement(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-berry/10 font-bold text-berry hover:bg-berry/20"
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-bold text-espresso">{qtyOf(item)}</span>
                        <button
                          type="button"
                          aria-label="+"
                          onClick={() => handleAdd(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-berry font-bold text-white hover:bg-berry-dark"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdd(item)}
                        className="rounded-full bg-berry/10 px-3.5 py-1.5 text-xs font-semibold text-berry transition-colors hover:bg-berry hover:text-white"
                      >
                        {item.isBox ? t("spot.box_configure") : `+ ${t("spot.add")}`}
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

      {/* Item details — opened by tapping an image or title. */}
      <MenuItemDetailModal
        item={detailItem}
        quantity={detailItem ? qtyOf(detailItem) : 0}
        onClose={() => setDetailItem(null)}
        onAdd={(item) => {
          handleAdd(item);
          if (!item.isBox) setDetailItem(null);
        }}
        onDecrement={decrement}
      />

      {/* Box taste picker. */}
      <BoxPickerModal box={boxItem} onClose={() => setBoxItem(null)} onConfirm={confirmBox} />
    </div>
  );
}
