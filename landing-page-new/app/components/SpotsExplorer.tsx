"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { City, Spot } from "../lib/types";
import { fetchCities, fetchAllSpots, fetchSpotsByCity } from "../lib/api";
import { useI18n } from "../i18n/I18nProvider";
import { CitySelector } from "./CitySelector";
import { SpotCard } from "./SpotCard";

// The map pulls in the Google Maps SDK; load it client-side only.
const SpotsMap = dynamic(
  () => import("./SpotsMap").then((m) => m.SpotsMap),
  { ssr: false },
);

const hasMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

type View = "map" | "list";

export function SpotsExplorer() {
  const { t } = useI18n();

  const [cities, setCities] = useState<City[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View>(hasMapsKey ? "map" : "list");

  // Load the city list once.
  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  // Load spots whenever the city filter changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const load = selectedCityId
      ? fetchSpotsByCity(selectedCityId)
      : fetchAllSpots();
    load
      .then((data) => {
        if (cancelled) return;
        setSpots(data);
        setActiveSpotId(null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCityId]);

  // Clicking a marker selects it; clicking the already-active one (or the
  // preview's close button) clears the selection.
  const handleMarkerClick = useCallback(
    (spotId: string) => setActiveSpotId((cur) => (cur === spotId ? null : spotId)),
    [],
  );

  const countLabel = useMemo(
    () => t("spots.count", { count: spots.length }),
    [spots.length, t],
  );

  return (
    <section className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-black tracking-tight text-espresso sm:text-4xl">
            {t("spots.title")}
          </h1>
          <p className="mt-3 text-lg text-espresso/65">{t("spots.subtitle")}</p>
        </div>

        <div className="mt-10">
          <CitySelector
            cities={cities}
            selectedCityId={selectedCityId}
            onSelect={setSelectedCityId}
          />
        </div>

        {/* Count + view toggle */}
        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm font-medium text-espresso/60">
            {loading ? t("spots.loading") : error ? "" : countLabel}
          </span>
          {hasMapsKey && (
            <div className="flex rounded-full border border-berry/20 bg-white p-1">
              {(["map", "list"] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    view === v ? "bg-berry text-white" : "text-espresso/70"
                  }`}
                >
                  {t(v === "map" ? "spots.map_map_view" : "spots.map_list_view")}
                </button>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-10 rounded-3xl border border-berry/10 bg-white p-12 text-center">
            <div className="text-5xl">🍦</div>
            <p className="mt-4 text-espresso/65">{t("spots.error")}</p>
          </div>
        ) : loading ? (
          <div className="mt-10 flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
          </div>
        ) : spots.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-berry/10 bg-white p-12 text-center">
            <div className="text-5xl">🍨</div>
            <p className="mt-4 text-espresso/65">{t("spots.none")}</p>
          </div>
        ) : (
          <div className="mt-8">
            {/* Map */}
            {hasMapsKey && view === "map" && (
              <div className="mb-8 h-[480px] overflow-hidden rounded-3xl border border-berry/10 shadow-sm">
                <SpotsMap
                  spots={spots}
                  activeSpotId={activeSpotId}
                  onMarkerClick={handleMarkerClick}
                  useGeolocation
                  showPreview
                />
              </div>
            )}

            {!hasMapsKey && (
              <div className="mb-8 rounded-2xl border border-mango/30 bg-mango/10 px-5 py-3 text-sm text-espresso/70">
                ℹ️ {t("spots.map_unavailable")}
              </div>
            )}

            {/* Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {spots.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  active={spot.id === activeSpotId}
                  onHover={setActiveSpotId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
