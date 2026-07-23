// Lightweight Google Places/Geocoding helpers over the REST API, so the
// checkout address field doesn't need the Maps JS SDK (which is loaded with a
// specific loader id elsewhere and would conflict on `libraries`).

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const placesConfigured = Boolean(KEY);

export type PlacePrediction = { description: string; placeId: string };
export type GeocodedPlace = { address: string; latitude: number; longitude: number };

/**
 * Autocomplete address predictions for a query. Returns [] if unconfigured or
 * on any error (the UI falls back gracefully). A session token groups the
 * autocomplete + details calls for billing.
 */
export async function fetchPlacePredictions(
  query: string,
  sessionToken: string,
): Promise<PlacePrediction[]> {
  if (!KEY || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    input: query,
    key: KEY,
    types: "address",
    language: "pl",
    components: "country:pl|country:ua",
    sessiontoken: sessionToken,
  });
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
    );
    const json = await res.json();
    if (json.status !== "OK") return [];
    return (json.predictions ?? []).map((p: { description: string; place_id: string }) => ({
      description: p.description,
      placeId: p.place_id,
    }));
  } catch {
    return [];
  }
}

/** Resolve a prediction's place id to an address + lat/lng. */
export async function geocodePlaceId(
  placeId: string,
  sessionToken: string,
): Promise<GeocodedPlace | null> {
  if (!KEY) return null;
  const params = new URLSearchParams({
    place_id: placeId,
    key: KEY,
    language: "pl",
    fields: "formatted_address,geometry",
    sessiontoken: sessionToken,
  });
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
    );
    const json = await res.json();
    if (json.status !== "OK" || !json.result?.geometry?.location) return null;
    return {
      address: json.result.formatted_address ?? "",
      latitude: json.result.geometry.location.lat,
      longitude: json.result.geometry.location.lng,
    };
  } catch {
    return null;
  }
}

// Cheap random session token (Math.random is fine here — billing grouping only).
export function newSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
