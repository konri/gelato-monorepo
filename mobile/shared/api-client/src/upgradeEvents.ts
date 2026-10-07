/**
 * UPGRADE_REQUIRED signal (BRANDS_SPEC §5.2, A1). The server answers an outdated
 * build with `extensions.code = 'UPGRADE_REQUIRED'` (GraphQL, WS) or HTTP 426
 * `{ code: 'UPGRADE_REQUIRED' }` (REST). The api-client emits here and
 * <UpgradeRequiredGate> covers the app with an "update the app" screen.
 *
 * The state is sticky: a gate that mounts after the event still shows it.
 */

export type UpgradeInfo = {
  minVersion?: string | null;
  minApi?: number | null;
};

type Listener = (info: UpgradeInfo) => void;

const listeners = new Set<Listener>();
let current: UpgradeInfo | null = null;

export const onUpgradeRequired = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getUpgradeRequired = (): UpgradeInfo | null => current;

export const emitUpgradeRequired = (info: UpgradeInfo = {}): void => {
  current = {
    minVersion: info.minVersion ?? current?.minVersion ?? null,
    minApi: info.minApi ?? current?.minApi ?? null,
  };
  const snapshot = current;
  listeners.forEach((l) => {
    try {
      l(snapshot);
    } catch {
      /* ignore */
    }
  });
};

/** Pulls `minVersion` / `minApi` out of a GraphQL `extensions` or REST error body. */
export const upgradeInfoFrom = (source: unknown): UpgradeInfo => {
  if (!source || typeof source !== 'object') return {};
  const s = source as Record<string, unknown>;
  return {
    minVersion: typeof s.minVersion === 'string' ? s.minVersion : null,
    minApi: typeof s.minApi === 'number' ? s.minApi : null,
  };
};
