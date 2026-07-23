"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Spot, SpotReview } from "../lib/types";
import { fetchSpot, fetchSpotReviews } from "../lib/api";
import { isSpotOpenNow, WEEKDAYS, localizedCityName } from "../lib/spot-utils";
import { useI18n } from "../i18n/I18nProvider";
import { SpotMenu } from "./SpotMenu";

const SpotsMap = dynamic(() => import("./SpotsMap").then((m) => m.SpotsMap), {
  ssr: false,
});

const hasMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

export function SpotDetail({ spotId }: { spotId: string }) {
  const { t, locale } = useI18n();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<SpotReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSpot(spotId)
      .then((data) => {
        if (cancelled) return;
        if (!data) setNotFound(true);
        else setSpot(data);
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    fetchSpotReviews(spotId)
      .then((data) => !cancelled && setReviews(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
      </div>
    );
  }

  if (notFound || !spot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="text-6xl">🍦</div>
        <p className="text-lg text-espresso/70">{t("spot.not_found")}</p>
        <Link
          href="/spots"
          className="rounded-full bg-berry px-6 py-3 font-semibold text-white"
        >
          {t("spot.back")}
        </Link>
      </div>
    );
  }

  const open = isSpotOpenNow(spot.openingHours);
  const hours = spot.openingHours ?? null;
  const gallery = (spot.photos ?? []).filter(Boolean);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;

  return (
    <article className="pb-20">
      {/* Cover */}
      <div className="relative h-64 w-full overflow-hidden bg-cream-soft sm:h-80">
        {spot.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={spot.coverUrl} alt={spot.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-strawberry/30 to-berry/20 text-7xl">
            <span aria-hidden>🍦</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 to-transparent" />
        <div className="absolute left-0 top-0 p-5">
          <Link
            href="/spots"
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-espresso backdrop-blur transition-colors hover:bg-white"
          >
            <span aria-hidden>←</span>
            {t("spot.back")}
          </Link>
        </div>
        {open !== null && (
          <span
            className={`absolute bottom-4 left-5 rounded-full px-4 py-1.5 text-sm font-semibold text-white ${
              open ? "bg-pistachio" : "bg-espresso/80"
            }`}
          >
            {open ? t("spots.open_now") : t("spots.closed")}
          </span>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-5">
        {/* Business-card header */}
        <div className="-mt-10 relative rounded-3xl border border-berry/10 bg-white p-6 shadow-xl shadow-berry/10 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {spot.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={spot.logoUrl}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-cream-soft"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-black tracking-tight text-espresso">{spot.name}</h1>
              {spot.averageRating != null && (spot.reviewCount ?? 0) > 0 && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-amber-500" aria-hidden>
                    {"★".repeat(Math.round(spot.averageRating))}
                    <span className="text-espresso/20">
                      {"★".repeat(5 - Math.round(spot.averageRating))}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-espresso">
                    {spot.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-espresso/50">({spot.reviewCount})</span>
                </div>
              )}
              {spot.city && (
                <p className="mt-1 text-sm font-medium text-berry">
                  {localizedCityName(spot.city, locale)}
                </p>
              )}
              {spot.description && (
                <p className="mt-2 leading-relaxed text-espresso/70">{spot.description}</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-105"
            >
              <span aria-hidden>🧭</span>
              {t("spot.directions")}
            </a>
            {spot.phone && (
              <a
                href={`tel:${spot.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-berry/20 bg-white px-5 py-2.5 text-sm font-semibold text-espresso transition-colors hover:border-berry"
              >
                <span aria-hidden>📞</span>
                {t("spot.call")}
              </a>
            )}
            <a
              href="#menu"
              className="inline-flex items-center gap-2 rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-berry/25 transition-transform hover:scale-105"
            >
              <span aria-hidden>🍨</span>
              {t("spot.order_here")}
            </a>
          </div>
        </div>

        {/* Menu — select products */}
        <section id="menu" className="mt-8 scroll-mt-24">
          <h2 className="mb-4 text-2xl font-black tracking-tight text-espresso">
            {t("spot.menu")}
          </h2>
          <SpotMenu spotId={spot.id} spotName={spot.name} />
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-2xl font-black tracking-tight text-espresso">
              {t("spot.reviews")}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-3xl border border-berry/10 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-espresso">{r.authorName}</span>
                    <span className="text-xs text-espresso/50">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 text-amber-500" aria-hidden>
                    {"★".repeat(r.rating)}
                    <span className="text-espresso/20">{"★".repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-espresso/70">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Address + map */}
          <div className="rounded-3xl border border-berry/10 bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-espresso">
              <span aria-hidden>📍</span>
              {t("spot.address")}
            </h2>
            <p className="mt-2 text-espresso/70">{spot.address}</p>
            {hasMapsKey && (
              <div className="mt-4 h-48 overflow-hidden rounded-2xl border border-berry/10">
                <SpotsMap spots={[spot]} activeSpotId={spot.id} onMarkerClick={() => {}} />
              </div>
            )}
          </div>

          {/* Opening hours */}
          {hours && (
            <div className="rounded-3xl border border-berry/10 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-espresso">
                <span aria-hidden>🕐</span>
                {t("spot.opening_hours")}
              </h2>
              <dl className="mt-3 space-y-1.5">
                {WEEKDAYS.map((day) =>
                  hours[day] ? (
                    <div key={day} className="flex justify-between text-sm">
                      <dt className="text-espresso/60">{t(`spot.weekday.${day}`)}</dt>
                      <dd className="font-medium text-espresso">{hours[day]}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </div>
          )}

          {/* Contact */}
          {(spot.phone || spot.email) && (
            <div className="rounded-3xl border border-berry/10 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-espresso">
                <span aria-hidden>✉️</span>
                {t("spot.contact")}
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                {spot.phone && (
                  <a href={`tel:${spot.phone}`} className="flex items-center gap-3 text-espresso/80 hover:text-berry">
                    <span aria-hidden>📞</span>
                    {spot.phone}
                  </a>
                )}
                {spot.email && (
                  <a href={`mailto:${spot.email}`} className="flex items-center gap-3 text-espresso/80 hover:text-berry">
                    <span aria-hidden>📧</span>
                    {spot.email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Delivery + features */}
          <div className="rounded-3xl border border-berry/10 bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-espresso">
              <span aria-hidden>🚴</span>
              {t("spot.delivery")}
            </h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              {spot.deliveryEnabled ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-espresso/60">{t("spot.delivery_radius")}</dt>
                    <dd className="font-medium text-espresso">{spot.deliveryRadiusKm} km</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-espresso/60">{t("spot.delivery_fee")}</dt>
                    <dd className="font-medium text-espresso">{spot.deliveryFee} zł</dd>
                  </div>
                  {spot.freeDeliveryThreshold ? (
                    <p className="pt-1 text-pistachio">
                      {t("spot.free_delivery", { amount: spot.freeDeliveryThreshold })}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-espresso/60">—</p>
              )}
            </dl>
            {(spot.hasSeating || spot.accessibilityFeatures) && (
              <div className="mt-4 space-y-2 border-t border-berry/10 pt-4 text-sm">
                {spot.hasSeating && (
                  <p className="flex items-center gap-2 text-espresso/80">
                    <span aria-hidden>🪑</span>
                    {spot.seatingCapacity
                      ? t("spot.seating_capacity", { count: spot.seatingCapacity })
                      : t("spot.seating")}
                  </p>
                )}
                {spot.accessibilityFeatures && (
                  <p className="flex items-center gap-2 text-espresso/80">
                    <span aria-hidden>♿</span>
                    {spot.accessibilityFeatures}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Photo gallery */}
        {gallery.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-espresso">
              <span aria-hidden>📸</span>
              {t("spot.photos")}
            </h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {gallery.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt=""
                  className="h-40 w-60 shrink-0 rounded-2xl object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
