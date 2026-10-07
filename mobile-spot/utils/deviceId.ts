import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuidV4 } from './requestId';

/**
 * Stable per-install device id (BRANDS_SPEC §4.6, live bug C7).
 *
 * The Expo session id used before changed on every launch, so each launch created a new
 * DeviceToken row for the same FCM token and per-device spot routing
 * (`DeviceToken.activeSpotId`) never stuck. This id is generated once and kept
 * for the life of the install (it survives sign-out on purpose).
 */

const KEY = 'deviceInstallId';

let cached: string | null = null;
let pending: Promise<string> | null = null;

export async function getInstallId(): Promise<string> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async () => {
    try {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored) {
        cached = stored;
        return stored;
      }
    } catch {
      /* fall through: generate a new one */
    }
    const id = uuidV4();
    cached = id;
    try {
      await AsyncStorage.setItem(KEY, id);
    } catch {
      /* keep the in-memory id for this launch */
    }
    return id;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
