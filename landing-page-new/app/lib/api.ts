import type { City, Spot, Taste, Product, SpotReview } from "./types";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./auth-storage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

const AUTH_ERROR_PATTERNS = [
  "access denied",
  "unauthorized",
  "not authenticated",
  "jwt expired",
  "jwt malformed",
  "invalid token",
];

const isAuthError = (message: string) =>
  AUTH_ERROR_PATTERNS.some((p) => message.toLowerCase().includes(p));

/**
 * Callback invoked when the session can no longer be refreshed, so the
 * AuthProvider can clear state and send the user back to login.
 */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: (() => void) | null) {
  onSessionExpired = fn;
}

async function rawGql<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  token: string | null,
): Promise<GraphQLResponse<T>> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status}`);
  }
  return (await res.json()) as GraphQLResponse<T>;
}

// Single-flight refresh so concurrent 401s trigger only one refresh call.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  refreshInFlight = (async () => {
    try {
      const json = await rawGql<{ refreshToken: string }>(
        `mutation RefreshToken($refreshToken: String!) { refreshToken(refreshToken: $refreshToken) }`,
        { refreshToken },
        null,
      );
      const next = json.data?.refreshToken;
      if (next) {
        setTokens(next, refreshToken);
        return next;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * Public (unauthenticated) GraphQL call. Used for cities/spots/prizes browse.
 */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const json = await rawGql<T>(query, variables, null);
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new Error("Empty API response");
  }
  return json.data;
}

/**
 * Authenticated GraphQL call: attaches the access token and, on an auth
 * error, transparently refreshes once and retries. If refresh fails, the
 * session-expired handler fires and the error propagates.
 */
export async function authGql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let json = await rawGql<T>(query, variables, getAccessToken());

  if (json.errors?.length && json.errors.some((e) => isAuthError(e.message))) {
    const next = await refreshAccessToken();
    if (next) {
      json = await rawGql<T>(query, variables, next);
    } else {
      clearTokens();
      onSessionExpired?.();
    }
  }

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new Error("Empty API response");
  }
  return json.data;
}

const CITY_FIELDS = `
  id
  name
  nameLocal
  country
  latitude
  longitude
  isActive
`;

const SPOT_FIELDS = `
  id
  name
  description
  address
  cityId
  latitude
  longitude
  phone
  email
  logoUrl
  coverUrl
  photos
  openingHours
  deliveryEnabled
  deliveryRadiusKm
  deliveryFee
  freeDeliveryThreshold
  hasSeating
  seatingCapacity
  accessibilityFeatures
  averageRating
  reviewCount
  isActive
`;

export async function fetchCities(): Promise<City[]> {
  const data = await gql<{ cities: City[] }>(
    `query Cities { cities { ${CITY_FIELDS} } }`,
  );
  return data.cities;
}

export async function fetchSpotsByCity(cityId: string): Promise<Spot[]> {
  const data = await gql<{ spotsByCity: Spot[] }>(
    `query SpotsByCity($cityId: ID!) { spotsByCity(cityId: $cityId) { ${SPOT_FIELDS} } }`,
    { cityId },
  );
  return data.spotsByCity;
}

export async function fetchAllSpots(): Promise<Spot[]> {
  const data = await gql<{ spots: Spot[] }>(
    `query Spots { spots { ${SPOT_FIELDS} } }`,
  );
  return data.spots;
}

export async function fetchSpot(id: string): Promise<Spot | null> {
  const data = await gql<{ spot: Spot | null }>(
    `query Spot($id: ID!) {
      spot(id: $id) {
        ${SPOT_FIELDS}
        city { id name nameLocal }
      }
    }`,
    { id },
  );
  return data.spot;
}

export async function fetchSpotReviews(spotId: string): Promise<SpotReview[]> {
  const data = await gql<{ spotReviews: SpotReview[] }>(
    `query SpotReviews($spotId: ID!, $limit: Int) {
      spotReviews(spotId: $spotId, limit: $limit) {
        id rating comment authorName createdAt
      }
    }`,
    { spotId, limit: 20 },
  );
  return data.spotReviews;
}

const TASTE_FIELDS = `
  id spotId title titleLocal subtitle description type imageUrl price kcalPerPortion allergens isAvailable
`;

const PRODUCT_FIELDS = `
  id spotId name nameLocal description type imageUrl price isBox maxTastes allergens isAvailable
`;

export async function fetchSpotTastes(spotId: string): Promise<Taste[]> {
  const data = await gql<{ spotTastes: Taste[] }>(
    `query SpotTastes($spotId: ID!) { spotTastes(spotId: $spotId) { ${TASTE_FIELDS} } }`,
    { spotId },
  );
  return data.spotTastes;
}

export async function fetchSpotProducts(spotId: string): Promise<Product[]> {
  const data = await gql<{ spotProducts: Product[] }>(
    `query SpotProducts($spotId: ID!) { spotProducts(spotId: $spotId) { ${PRODUCT_FIELDS} } }`,
    { spotId },
  );
  return data.spotProducts;
}
