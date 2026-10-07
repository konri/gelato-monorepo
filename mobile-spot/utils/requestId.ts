import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Idempotency keys for counter actions (BRANDS_SPEC §4.8, A3): awarding
 * points and exchanging points for a reward send a `requestId`. A retry of
 * the SAME action after an unknown outcome (timeout, lost connection, the
 * screen closed while the request was running, the app restarted) must reuse
 * it, so the server records the action once and answers the repeat with
 * `duplicate: true`.
 *
 * The keys live outside any component: in a module-level map, mirrored to
 * AsyncStorage, keyed by spot | customer | action | selection, for 10 minutes
 * after the last attempt. A key is dropped only when the outcome is known: a
 * success shown on screen (duplicates included) or a definitive rejection
 * from the server.
 */

export function uuidV4(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string; getRandomValues?: (a: Uint8Array) => Uint8Array } })
    .crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** How long an unsettled key is kept after its last attempt. */
export const PENDING_REQUEST_TTL_MS = 10 * 60 * 1000;

const STORAGE_KEY = 'counter.pendingRequestIds.v1';

export type CounterAction = 'award' | 'exchange';

type Entry = { id: string; at: number };

const pending = new Map<string, Entry>();
let loaded: Promise<void> | null = null;

function prune(now = Date.now()): void {
  for (const [key, entry] of pending) {
    if (now - entry.at > PENDING_REQUEST_TTL_MS) pending.delete(key);
  }
}

/** Reads the keys of a previous app run once (in-memory only when storage fails). */
function load(): Promise<void> {
  if (!loaded) {
    loaded = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === 'object') {
          for (const [key, value] of Object.entries(parsed as Record<string, Partial<Entry>>)) {
            if (pending.has(key) || typeof value?.id !== 'string' || typeof value.at !== 'number') continue;
            pending.set(key, { id: value.id, at: value.at });
          }
        }
      } catch {
        /* storage unavailable: keep the keys of this run only */
      }
      prune();
    })();
  }
  return loaded;
}

function persist(): void {
  prune();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(pending))).catch(() => {
    /* best effort */
  });
}

/** The key of one counter action: the same spot, customer, action and selection share a requestId. */
export function counterActionKey(spotId: string, customerId: string, action: CounterAction, selection: string): string {
  return `${spotId}|${customerId}|${action}|${selection}`;
}

export const pendingRequestIds = {
  /** The requestId for `key`: the pending one when it is still unsettled, else a new one. */
  async acquire(key: string): Promise<string> {
    await load();
    const now = Date.now();
    prune(now);
    const id = pending.get(key)?.id ?? uuidV4();
    pending.set(key, { id, at: now });
    persist();
    return id;
  },

  /** The outcome of `id` is known (success shown, or a definitive rejection): the next action gets a new key. */
  settle(key: string, id: string): void {
    if (pending.get(key)?.id !== id) return;
    pending.delete(key);
    persist();
  },
};
