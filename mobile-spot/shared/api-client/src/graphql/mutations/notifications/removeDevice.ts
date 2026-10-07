import { config } from '@/config';
import { clientHeaders } from '../../../clientInfo';

// Inlined as a string and sent with a raw fetch: sign-out must not go through
// executeGraphQLQuery (no refresh / session-expiry / toast side effects while
// the session is being torn down).
const REMOVE_DEVICE_MUTATION = `
  mutation RemoveDevice($deviceId: String!) {
    removeFCMToken(deviceId: $deviceId)
  }
`;

const TIMEOUT_MS = 4000;

/**
 * Deactivates this install's push token for the signed-in user, so a shared
 * tablet stops receiving the previous user's pushes. Best effort: resolves
 * false on any failure and never throws.
 */
export async function removeDeviceToken(deviceId: string, accessToken: string | null): Promise<boolean> {
  if (!accessToken || !deviceId) return false;
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), TIMEOUT_MS));
  const request = (async () => {
    try {
      const response = await fetch(`${config.API_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...clientHeaders(),
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: REMOVE_DEVICE_MUTATION, variables: { deviceId } }),
      });
      const json = await response.json().catch(() => null);
      return json?.data?.removeFCMToken === true;
    } catch {
      return false;
    }
  })();
  return Promise.race([request, timeout]);
}
