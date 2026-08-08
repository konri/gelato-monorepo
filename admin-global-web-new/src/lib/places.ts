// Google Places Autocomplete + Geocoding via the Maps JavaScript SDK.
// The REST Places API has no CORS headers, so it can't be called directly
// from the browser — the JS SDK is Google's supported browser-side option.

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const placesConfigured = Boolean(KEY);

export type PlacePrediction = { description: string; placeId: string };
export type GeocodedPlace = { address: string; latitude: number; longitude: number };

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (!KEY) return Promise.reject(new Error('Google Maps API key not configured'));
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

/**
 * Autocomplete predictions for a query. `type` selects between full street
 * addresses (for spots) and city-level results (for city centers).
 */
export async function fetchPlacePredictions(
  query: string,
  type: 'address' | '(cities)' = 'address',
): Promise<PlacePrediction[]> {
  if (!KEY || query.trim().length < 2) return [];
  try {
    await loadGoogleMaps();
    const { AutocompleteSuggestion } = (await google.maps.importLibrary(
      'places',
    )) as google.maps.PlacesLibrary;
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: query,
      includedPrimaryTypes: type === '(cities)' ? ['locality'] : ['street_address', 'route'],
      language: 'pl',
    });
    return (suggestions ?? [])
      .filter((s) => s.placePrediction)
      .map((s) => ({
        description: s.placePrediction!.text.text,
        placeId: s.placePrediction!.placeId,
      }));
  } catch {
    return [];
  }
}

/** Resolve a prediction's place id to an address + lat/lng. */
export async function geocodePlaceId(placeId: string): Promise<GeocodedPlace | null> {
  if (!KEY) return null;
  try {
    await loadGoogleMaps();
    const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
    const place = new Place({ id: placeId });
    await place.fetchFields({ fields: ['formattedAddress', 'location'] });
    if (!place.location) return null;
    return {
      address: place.formattedAddress ?? '',
      latitude: place.location.lat(),
      longitude: place.location.lng(),
    };
  } catch {
    return null;
  }
}
