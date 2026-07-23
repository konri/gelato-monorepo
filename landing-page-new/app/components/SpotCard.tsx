"use client";

import Link from "next/link";
import type { Spot } from "../lib/types";
import { isSpotOpenNow } from "../lib/spot-utils";
import { useI18n } from "../i18n/I18nProvider";

type Props = {
  spot: Spot;
  active?: boolean;
  onHover?: (spotId: string | null) => void;
};

export function SpotCard({ spot, active, onHover }: Props) {
  const { t } = useI18n();
  const open = isSpotOpenNow(spot.openingHours);

  return (
    <Link
      href={`/spots/${spot.id}`}
      onMouseEnter={() => onHover?.(spot.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white transition-all ${
        active
          ? "border-berry shadow-xl shadow-berry/15"
          : "border-berry/10 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-berry/10"
      }`}
    >
      <div className="relative h-40 overflow-hidden bg-cream-soft">
        {spot.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={spot.coverUrl}
            alt={spot.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream-soft to-cream-deep text-5xl">
            <span aria-hidden>🍦</span>
          </div>
        )}
        {open !== null && (
          <span
            className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
              open ? "bg-pistachio" : "bg-espresso/80"
            }`}
          >
            {open ? t("spots.open_now") : t("spots.closed")}
          </span>
        )}
        {spot.deliveryEnabled && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-berry shadow-sm">
            🚴 {t("spots.delivery_available")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          {spot.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={spot.logoUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-cream-soft"
            />
          )}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-espresso">{spot.name}</h3>
            <p className="mt-0.5 truncate text-sm text-espresso/60">📍 {spot.address}</p>
          </div>
        </div>

        {spot.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-espresso/65">
            {spot.description}
          </p>
        )}

        <span className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-berry/10 px-4 py-2.5 text-sm font-semibold text-berry transition-colors group-hover:bg-berry group-hover:text-white">
          {t("spots.view_spot")}
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
