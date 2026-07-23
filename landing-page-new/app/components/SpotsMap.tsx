"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  GoogleMap,
  MarkerF,
  CircleF,
  useJsApiLoader,
} from "@react-google-maps/api";
import type { Spot } from "../lib/types";
import { boundsFor, densestCitySpots, isSpotOpenNow } from "../lib/spot-utils";
import { useI18n } from "../i18n/I18nProvider";

const containerStyle = { width: "100%", height: "100%" };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

type LatLng = { lat: number; lng: number };

type Props = {
  spots: Spot[];
  activeSpotId: string | null;
  onMarkerClick: (spotId: string) => void;
  /** Ask for the visitor's location on load and center there if granted. */
  useGeolocation?: boolean;
  /** Show the bottom preview card when a spot is active. */
  showPreview?: boolean;
};

export function SpotsMap({
  spots,
  activeSpotId,
  onMarkerClick,
  useGeolocation = false,
  showPreview = false,
}: Props) {
  const { t } = useI18n();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: "gelato-google-maps",
    googleMapsApiKey: apiKey || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  // Once we've focused the visitor's location (or resolved it can't be used),
  // we stop auto-fitting to spots so we don't yank the view back.
  const didInitialFocus = useRef(false);

  const { center, zoom } = useMemo(() => boundsFor(spots), [spots]);

  const focusSpots = useCallback((list: Spot[]) => {
    const map = mapRef.current;
    if (!map || list.length === 0) return;
    if (list.length === 1) {
      map.setCenter({ lat: list[0].latitude, lng: list[0].longitude });
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    list.forEach((s) => bounds.extend({ lat: s.latitude, lng: s.longitude }));
    map.fitBounds(bounds, 64);
  }, []);

  const goToUser = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(13);
      },
      () => {
        // Denied or unavailable — fall back to the densest city on first load.
        if (!didInitialFocus.current) focusSpots(densestCitySpots(spots));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }, [spots, focusSpots]);

  // Initial focus: geolocation (if opted in) → densest city → all spots.
  useEffect(() => {
    if (!isLoaded || !mapRef.current || spots.length === 0) return;
    if (didInitialFocus.current) return;
    didInitialFocus.current = true;

    if (useGeolocation && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          mapRef.current?.panTo(loc);
          mapRef.current?.setZoom(12);
        },
        () => focusSpots(densestCitySpots(spots)),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
      );
    } else {
      focusSpots(densestCitySpots(spots));
    }
  }, [isLoaded, spots, useGeolocation, focusSpots]);

  // Re-fit when the spot set changes AFTER the initial focus (e.g. city filter).
  const prevSpotKey = useRef<string>("");
  useEffect(() => {
    if (!isLoaded || !mapRef.current || spots.length === 0) return;
    const key = spots.map((s) => s.id).join(",");
    if (!didInitialFocus.current) return;
    if (key === prevSpotKey.current) return;
    prevSpotKey.current = key;
    focusSpots(spots);
  }, [spots, isLoaded, focusSpots]);

  // Pan to the active spot when selected from the list or a marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !activeSpotId) return;
    const spot = spots.find((s) => s.id === activeSpotId);
    if (spot) map.panTo({ lat: spot.latitude, lng: spot.longitude });
  }, [activeSpotId, spots, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream-soft">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
      </div>
    );
  }

  const activeSpot = spots.find((s) => s.id === activeSpotId) ?? null;

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
      >
        {/* Delivery radius of the active spot */}
        {activeSpot && activeSpot.deliveryEnabled && activeSpot.deliveryRadiusKm ? (
          <CircleF
            center={{ lat: activeSpot.latitude, lng: activeSpot.longitude }}
            radius={activeSpot.deliveryRadiusKm * 1000}
            options={{
              strokeColor: "#c026a3",
              strokeOpacity: 0.6,
              strokeWeight: 2,
              fillColor: "#c026a3",
              fillOpacity: 0.1,
            }}
          />
        ) : null}

        {/* Visitor location */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            title={t("spots.your_location")}
            zIndex={999}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        )}

        {spots.map((spot) => (
          <MarkerF
            key={spot.id}
            position={{ lat: spot.latitude, lng: spot.longitude }}
            title={spot.name}
            onClick={() => onMarkerClick(spot.id)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: spot.id === activeSpotId ? 11 : 8,
              fillColor: spot.id === activeSpotId ? "#8a1673" : "#c026a3",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        ))}
      </GoogleMap>

      {/* Locate-me button */}
      {typeof navigator !== "undefined" && navigator.geolocation && (
        <button
          type="button"
          onClick={goToUser}
          aria-label={t("spots.locate_me")}
          title={t("spots.locate_me")}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-berry shadow-lg shadow-berry/15 transition-transform hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 1v3M12 20v3M1 12h3M20 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Bottom preview card for the active spot */}
      {showPreview && activeSpot && (
        <MapSpotPreview
          spot={activeSpot}
          onClose={() => onMarkerClick(activeSpot.id)}
        />
      )}
    </div>
  );
}

function MapSpotPreview({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const { t } = useI18n();
  const open = isSpotOpenNow(spot.openingHours);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-4">
      <div className="pointer-events-auto flex w-full max-w-md items-stretch gap-3 rounded-2xl border border-berry/10 bg-white p-3 shadow-2xl shadow-berry/20 animate-fade-up">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-soft">
          {spot.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={spot.coverUrl} alt={spot.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">
              <span aria-hidden>🍦</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-bold text-espresso">{spot.name}</h3>
              <p className="truncate text-xs text-espresso/60">📍 {spot.address}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full p-1 text-espresso/40 transition-colors hover:bg-cream-soft hover:text-espresso"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            {open !== null ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                  open ? "bg-pistachio" : "bg-espresso/70"
                }`}
              >
                {open ? t("spots.open_now") : t("spots.closed")}
              </span>
            ) : (
              <span />
            )}
            <Link
              href={`/spots/${spot.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-berry px-3.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
            >
              {t("spots.view_spot")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
