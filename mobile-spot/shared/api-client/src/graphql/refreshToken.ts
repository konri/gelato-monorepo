import { config } from '@/config';
import { safeGetItem, safeSetItem } from '../utils/safeAsyncStorage';

// Inlined as a string (rather than a gql document) so we can POST it via raw
// fetch without depending on the Apollo client — avoids a circular import.
const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken)
  }
`;

// Single-flight guard: concurrent failed requests share one refresh round-trip.
let inFlight: Promise<string | null> | null = null;

/**
 * Exchange the stored refresh token for a fresh access token.
 * Persists the new access token and returns it (or null on failure).
 * Uses a raw fetch to avoid circular dependencies with the Apollo client.
 */
export const refreshAccessToken = async (apiUrl: string = config.API_URL): Promise<string | null> => {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const refreshToken = await safeGetItem('refresh_token');
      if (!refreshToken) return null;

      const response = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REFRESH_TOKEN_MUTATION,
          variables: { refreshToken },
        }),
      });

      const json = await response.json();
      const newToken: string | undefined = json?.data?.refreshToken;

      if (!newToken) return null;

      await safeSetItem('access_token', newToken);
      return newToken;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};
