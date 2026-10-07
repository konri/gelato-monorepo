import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoyaltyMe, LoyaltyOverview } from '@/shared/api-client/src/graphql/queries/loyalty/types';

/**
 * Device-side loyalty persistence (BRANDS_SPEC §5.2, §5.4). Every read and
 * write is best effort: a storage failure must never break My card.
 *
 *   SELECTED_KEY(uid)  selected brand; kept across logout for the same user,
 *                      removed on account delete.
 *   SNAPSHOT_KEY(uid)  last good overview WITHOUT reward codes; removed on
 *                      logout and on session expiry.
 *   LAST_CARD_KEY      { userId, loyaltyCode, firstName }; rewritten on every
 *                      `me`; removed on explicit logout and account delete,
 *                      kept on session expiry ("Show my card" on /welcome).
 *   CODE_FORMAT_KEY    'qr' | 'barcode', per device.
 */
export const SELECTED_KEY = (uid: string) => `loodly.selectedBrand.v1:${uid}`;
export const SNAPSHOT_KEY = (uid: string) => `loodly.loyaltyOverview.v1:${uid}`;
export const LAST_CARD_KEY = 'loodly.lastCard.v1';
export const CODE_FORMAT_KEY = 'loodly.codeFormat.v1';

export type LastCard = {
  userId: string;
  loyaltyCode: string;
  firstName?: string | null;
};

export type LoyaltySnapshot = {
  me: LoyaltyMe;
  overview: LoyaltyOverview;
  fetchedAt: number;
};

const readJson = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = async (key: string, value: unknown): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* best effort */
  }
};

const remove = async (keys: string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    /* best effort */
  }
};

/** The logged-in user's id as stored at login (`userData`), if any. */
export const readStoredUserId = async (): Promise<string | null> => {
  const user = await readJson<{ id?: string }>('userData');
  return typeof user?.id === 'string' && user.id ? user.id : null;
};

// --- Selected brand ---------------------------------------------------------

export const readSelectedBrand = async (uid: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SELECTED_KEY(uid));
  } catch {
    return null;
  }
};

export const writeSelectedBrand = async (uid: string, brandId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SELECTED_KEY(uid), brandId);
  } catch {
    /* best effort */
  }
};

// --- Overview snapshot (offline at the counter) -----------------------------

/** Drops reward codes: a stored snapshot never carries a `PR-` code. */
const withoutRewardCodes = (overview: LoyaltyOverview): LoyaltyOverview => ({
  ...overview,
  readyToPickUp: overview.readyToPickUp.map(({ qrCode: _qrCode, ...rest }) => rest),
});

export const readSnapshot = (uid: string) => readJson<LoyaltySnapshot>(SNAPSHOT_KEY(uid));

export const writeSnapshot = (uid: string, snapshot: LoyaltySnapshot) =>
  writeJson(SNAPSHOT_KEY(uid), { ...snapshot, overview: withoutRewardCodes(snapshot.overview) });

export const removeSnapshot = (uid: string) => remove([SNAPSHOT_KEY(uid)]);

// --- Last card (offline / after a session expiry) ---------------------------

export const readLastCard = async (): Promise<LastCard | null> => {
  const card = await readJson<LastCard>(LAST_CARD_KEY);
  return card && typeof card.loyaltyCode === 'string' && card.loyaltyCode ? card : null;
};

export const saveLastCard = async (me: Pick<LoyaltyMe, 'id' | 'loyaltyCode' | 'firstName'>) => {
  if (!me?.id || !me.loyaltyCode) return;
  await writeJson(LAST_CARD_KEY, {
    userId: me.id,
    loyaltyCode: me.loyaltyCode,
    firstName: me.firstName ?? null,
  } satisfies LastCard);
};

export const clearLastCard = () => remove([LAST_CARD_KEY]);

// --- Lifecycle --------------------------------------------------------------

/**
 * Explicit logout: the card and the snapshot go; the brand choice stays for
 * the same user. Account delete: everything of that user goes.
 */
export const clearLoyaltyStorageOnLogout = async (
  uid: string | null,
  reason: 'logout' | 'deleted',
): Promise<void> => {
  const keys = [LAST_CARD_KEY];
  if (uid) {
    keys.push(SNAPSHOT_KEY(uid));
    if (reason === 'deleted') keys.push(SELECTED_KEY(uid));
  }
  await remove(keys);
};
