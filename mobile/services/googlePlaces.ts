import { config } from '@/config';
import { logger } from '@/utils/logger';

/**
 * Thin wrapper over the Google Places / Geocoding REST APIs using the
 * EXPO_PUBLIC_GOOGLE_MAPS_API_KEY that is already configured. We use REST
 * (not a native SDK) so this works in Expo Go without a rebuild.
 */

const KEY = config.GOOGLE_MAPS_API_KEY;

export type PlacePrediction = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
};

export type GeocodedPlace = {
  address: string;
  latitude: number;
  longitude: number;
};

// A session token groups autocomplete keystrokes + the final details call so
// Google bills them as one session. Rotate it after each resolved place.
export const newSessionToken = (): string =>
  `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;

export const isPlacesConfigured = (): boolean => !!KEY;

/**
 * Autocomplete address predictions. Biased to Poland + optional location.
 */
export const fetchPlacePredictions = async (
  input: string,
  sessionToken: string,
  bias?: { latitude: number; longitude: number },
): Promise<PlacePrediction[]> => {
  if (!KEY || input.trim().length < 3) return [];

  const params = new URLSearchParams({
    input,
    key: KEY,
    sessiontoken: sessionToken,
    types: 'address',
    components: 'country:pl',
    language: 'pl',
  });
  if (bias) {
    params.set('location', `${bias.latitude},${bias.longitude}`);
    params.set('radius', '30000');
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
    );
    const json = await res.json();
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      logger.warn('Places autocomplete status:', json.status, json.error_message);
      return [];
    }
    return (json.predictions ?? []).map((p: any) => ({
      placeId: p.place_id,
      primaryText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
      description: p.description,
    }));
  } catch (e) {
    logger.error('Places autocomplete failed:', e);
    return [];
  }
};

/**
 * Resolve a placeId to a formatted address + coordinates.
 */
export const fetchPlaceDetails = async (
  placeId: string,
  sessionToken: string,
): Promise<GeocodedPlace | null> => {
  if (!KEY) return null;
  const params = new URLSearchParams({
    place_id: placeId,
    key: KEY,
    sessiontoken: sessionToken,
    fields: 'formatted_address,geometry',
    language: 'pl',
  });
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
    );
    const json = await res.json();
    if (json.status !== 'OK' || !json.result?.geometry?.location) {
      logger.warn('Place details status:', json.status);
      return null;
    }
    return {
      address: json.result.formatted_address,
      latitude: json.result.geometry.location.lat,
      longitude: json.result.geometry.location.lng,
    };
  } catch (e) {
    logger.error('Place details failed:', e);
    return null;
  }
};

/**
 * Reverse-geocode a coordinate to a formatted address (for "use my location").
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<GeocodedPlace | null> => {
  if (!KEY) return null;
  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: KEY,
    language: 'pl',
  });
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );
    const json = await res.json();
    const first = json.results?.[0];
    if (json.status !== 'OK' || !first) return null;
    return {
      address: first.formatted_address,
      latitude,
      longitude,
    };
  } catch (e) {
    logger.error('Reverse geocode failed:', e);
    return null;
  }
};

/**
 * Build a styled Google Static Map URL showing the spot + destination pins,
 * and optionally a live courier pin.
 */
export const staticMapUrl = (opts: {
  spot: { latitude: number; longitude: number };
  // Delivery destination; omit/null for pickup orders (spot pin only).
  destination?: { latitude: number; longitude: number } | null;
  courier?: { latitude: number; longitude: number } | null;
  width: number;
  height: number;
  scale?: number;
}): string | null => {
  if (!KEY) return null;
  const { spot, destination, courier, width, height, scale = 2 } = opts;
  const params = new URLSearchParams({
    size: `${Math.round(width)}x${Math.round(height)}`,
    scale: String(scale),
    key: KEY,
    language: 'pl',
  });
  // Spot pin (brand red 'S'); destination pin ('D') + path only when delivering.
  params.append('markers', `color:0xEC2828|label:S|${spot.latitude},${spot.longitude}`);
  if (destination) {
    params.append('markers', `color:0x212121|label:D|${destination.latitude},${destination.longitude}`);
  }
  if (courier) {
    // Courier pin (green 'C').
    params.append('markers', `color:0x16A34A|label:C|${courier.latitude},${courier.longitude}`);
  }
  if (destination) {
    params.append(
      'path',
      `color:0xEC282880|weight:3|${spot.latitude},${spot.longitude}|${destination.latitude},${destination.longitude}`,
    );
  }
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
};
