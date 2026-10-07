import { isAccessLevel, type AccessLevel } from '@/auth/levels';
import type { LoginBrand, LoginSpot, StaffKindVM, StaffLoginUser } from '@/shared/api-client/src/api/types';
import {
  getMyStaffContext,
  getMyStaffSpots,
  selectActiveSpot as apiSelectActiveSpot,
  type StaffContext,
  type StaffSpotRow,
} from '@/shared/api-client/src/graphql/queries/staffContext';
import { getInstallId } from '@/utils/deviceId';
import { leaveSpotScopedScreens } from '@/utils/leaveSpotScopedScreens';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The staff member's spot context (BRANDS_SPEC §4.2): every accessible spot
 * with the caller's level there, the brand, and the ACTIVE spot this device
 * works at. An external store (no React dependency) read with
 * useSyncExternalStore (hooks/useActiveSpot.ts), so the realtime layer, push
 * routing and async loaders can read the active spot synchronously.
 *
 * Every spot-scoped read goes through `getActiveSpotId()` / `useActiveSpotId()`.
 * Nothing reads the pre-brands AsyncStorage `spotContext` any more.
 */

export type SpotStatus =
  | 'idle' // session not known yet
  | 'loading' // signed in, waiting for myStaffContext (no cached context)
  | 'ready' // an active spot is selected
  | 'needsChoice' // several spots and no (valid / fresh) selection: /choose-spot
  | 'noAccess' // no spot at all
  | 'error' // myStaffContext failed and there is nothing cached
  | 'signedOut';

export type StaffSpotVM = {
  spotId: string;
  name: string;
  address: string | null;
  logoUrl: string | null;
  cityId: string | null;
  cityName: string | null;
  cityNameLocal: Record<string, string> | null;
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  /** The brand is active (an inactive brand pauses orders, points and rewards). */
  brandActive: boolean;
  /** The spot is active (false = draft or deactivated: not visible to customers). */
  isActive: boolean;
  /** The caller's level at this spot. */
  level: AccessLevel;
  pendingOrderCount: number;
  myOpenClaimedCount: number;
  /** Members with a profile at the spot (spot admins + employees; brand admins are not counted). */
  staffCount: number;
  manualAwardCap: number | null;
};

export type BrandVM = { id: string; name: string; logoUrl: string | null; isActive: boolean };

export type SpotState = {
  status: SpotStatus;
  userId: string | null;
  staffKind: StaffKindVM | null;
  /** The staff member's brand; null for PLATFORM (the Loodly team sees every brand). */
  brand: BrandVM | null;
  canManageBrand: boolean;
  spots: StaffSpotVM[];
  /** Server's last-used spot (last LOGIN / SPOT_SWITCH still accessible). */
  defaultSpotId: string | null;
  activeSpotId: string | null;
  /** When the active spot was chosen on this device (ms). */
  selectedAt: number | null;
  /** Highlighted row on the choose screen while `needsChoice`. */
  preselectSpotId: string | null;
  /**
   * The spot the server's LOGIN session row recorded (only with exactly one
   * spot at login). Cleared after the first selection, so it only ever spares
   * that one duplicate SPOT_SWITCH.
   */
  loginSpotId: string | null;
  /** +1 on every active-spot change. */
  epoch: number;
  /** Last successful myStaffContext (ms). */
  fetchedAt: number | null;
};

export type SwitchReason = 'user' | 'choose' | 'revalidate' | 'restore';

export type SpotNotice =
  | { kind: 'switched'; spotId: string; name: string; reason: SwitchReason }
  | { kind: 'lostAccess'; name: string }
  | { kind: 'passwordChangeRequired' };

const SESSION_KEY = 'staff.session.v2';
const LEGACY_KEY = 'spotContext';
const activeKey = (userId: string) => `staff.activeSpot.v2.${userId}`;

/** A selection older than this (or from a previous local day) asks again on a cold start. */
const SELECTION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const INITIAL: SpotState = {
  status: 'idle',
  userId: null,
  staffKind: null,
  brand: null,
  canManageBrand: false,
  spots: [],
  defaultSpotId: null,
  activeSpotId: null,
  selectedAt: null,
  preselectSpotId: null,
  loginSpotId: null,
  epoch: 0,
  fetchedAt: null,
};

let state: SpotState = INITIAL;
const listeners = new Set<() => void>();
const noticeListeners = new Set<(notice: SpotNotice) => void>();

// Bumped on reset(): in-flight work from a previous session drops its result.
let sessionGen = 0;
let refreshInFlight: Promise<void> | null = null;

function setState(patch: Partial<SpotState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      logger.error('spotStore listener failed', e);
    }
  });
}

function emitNotice(notice: SpotNotice): void {
  noticeListeners.forEach((l) => {
    try {
      l(notice);
    } catch {
      /* ignore */
    }
  });
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function fromLoginSpot(s: LoginSpot, brand: LoginBrand | null | undefined): StaffSpotVM {
  return {
    spotId: s.id,
    name: s.name,
    address: null,
    logoUrl: s.logoUrl ?? null,
    cityId: s.cityId ?? null,
    // Already in the user's language.
    cityName: s.cityName ?? null,
    cityNameLocal: null,
    brandId: s.brandId,
    brandName: s.brandName,
    brandLogoUrl: s.brandLogoUrl ?? null,
    brandActive: brand && brand.id === s.brandId ? brand.isActive : true,
    isActive: s.isActive,
    level: isAccessLevel(s.level) ? s.level : 'OPERATE',
    pendingOrderCount: 0,
    myOpenClaimedCount: 0,
    staffCount: 0,
    manualAwardCap: null,
  };
}

function fromStaffSpot(r: StaffSpotRow): StaffSpotVM {
  return {
    spotId: r.spotId,
    name: r.spot.name,
    address: r.spot.address ?? null,
    logoUrl: r.spot.logoUrl ?? null,
    cityId: r.spot.city?.id ?? r.spot.cityId ?? null,
    cityName: r.spot.city?.name ?? null,
    cityNameLocal: r.spot.city?.nameLocal ?? null,
    brandId: r.brandId,
    brandName: r.brandName,
    brandLogoUrl: r.brandLogoUrl ?? null,
    brandActive: r.spot.brand?.isActive ?? true,
    isActive: r.isActive,
    level: isAccessLevel(r.level) ? r.level : 'OPERATE',
    pendingOrderCount: r.pendingOrderCount ?? 0,
    myOpenClaimedCount: r.myOpenClaimedCount ?? 0,
    staffCount: r.staffCount ?? 0,
    manualAwardCap: r.manualAwardCap ?? null,
  };
}

function kindFromScope(scope: StaffContext['scope']): StaffKindVM | null {
  return scope === 'NONE' ? null : scope;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

type StoredSelection = { spotId: string; selectedAt: number };

type StoredSession = {
  userId: string;
  staffKind: StaffKindVM | null;
  brand: BrandVM | null;
  canManageBrand: boolean;
  spots: StaffSpotVM[];
  defaultSpotId: string | null;
  loginSpotId: string | null;
  fetchedAt: number | null;
};

async function readSelection(userId: string): Promise<StoredSelection | null> {
  try {
    const raw = await AsyncStorage.getItem(activeKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSelection>;
    if (typeof parsed?.spotId !== 'string') return null;
    return { spotId: parsed.spotId, selectedAt: typeof parsed.selectedAt === 'number' ? parsed.selectedAt : 0 };
  } catch {
    return null;
  }
}

async function writeSelection(userId: string, selection: StoredSelection): Promise<void> {
  try {
    await AsyncStorage.setItem(activeKey(userId), JSON.stringify(selection));
  } catch (e) {
    logger.warn('spotStore: could not persist the active spot', e);
  }
}

async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function persistSession(): void {
  if (!state.userId) return;
  const data: StoredSession = {
    userId: state.userId,
    staffKind: state.staffKind,
    brand: state.brand,
    canManageBrand: state.canManageBrand,
    spots: state.spots,
    defaultSpotId: state.defaultSpotId,
    loginSpotId: state.loginSpotId,
    fetchedAt: state.fetchedAt,
  };
  AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data)).catch(() => {
    /* cache only */
  });
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

const startOfToday = (now = Date.now()) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** A selection from a previous local day, or older than 8 hours. */
function isStaleSelection(selectedAt: number | null, now = Date.now()): boolean {
  if (!selectedAt) return true;
  return selectedAt < startOfToday(now) || now - selectedAt > SELECTION_MAX_AGE_MS;
}

const hasSpot = (spotId: string | null | undefined): spotId is string =>
  !!spotId && state.spots.some((s) => s.spotId === spotId);

/** Activates a spot without the user-facing side effects (restore / single spot). */
function activateQuietly(spotId: string, selectedAt?: number): void {
  const at = selectedAt ?? Date.now();
  const changed = state.activeSpotId !== spotId;
  // The first activation after login is the one its LOGIN row recorded.
  const consumesLoginSpot = state.loginSpotId !== null;
  setState({
    status: 'ready',
    activeSpotId: spotId,
    selectedAt: at,
    preselectSpotId: null,
    loginSpotId: null,
    epoch: changed ? state.epoch + 1 : state.epoch,
  });
  if (state.userId) void writeSelection(state.userId, { spotId, selectedAt: at });
  if (consumesLoginSpot) persistSession();
}

function needsChoice(preselect: string | null): void {
  const changed = state.activeSpotId !== null;
  setState({
    status: 'needsChoice',
    activeSpotId: null,
    preselectSpotId: hasSpot(preselect) ? preselect : hasSpot(state.defaultSpotId) ? state.defaultSpotId : null,
    epoch: changed ? state.epoch + 1 : state.epoch,
  });
}

function noAccess(): void {
  const changed = state.activeSpotId !== null;
  setState({
    status: 'noAccess',
    activeSpotId: null,
    preselectSpotId: null,
    epoch: changed ? state.epoch + 1 : state.epoch,
  });
}

/**
 * Cold start (or recovery from loading / error / noAccess): restore the
 * device's last spot when it is still accessible, unless the user can switch
 * and the selection is from a previous day or older than 8 hours (then ask).
 */
function resolveRestore(selection: StoredSelection | null): void {
  const { spots } = state;
  if (spots.length === 0) return noAccess();
  if (spots.length === 1) return activateQuietly(spots[0].spotId, selection?.spotId === spots[0].spotId ? selection.selectedAt : undefined);
  if (selection && hasSpot(selection.spotId)) {
    if (isStaleSelection(selection.selectedAt)) return needsChoice(selection.spotId);
    return activateQuietly(selection.spotId, selection.selectedAt);
  }
  return needsChoice(null);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function getState(): SpotState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function onNotice(listener: (notice: SpotNotice) => void): () => void {
  noticeListeners.add(listener);
  return () => noticeListeners.delete(listener);
}

function getActiveSpotId(): string | null {
  return state.status === 'ready' ? state.activeSpotId : null;
}

function getActiveSpot(): StaffSpotVM | null {
  const id = getActiveSpotId();
  return id ? state.spots.find((s) => s.spotId === id) ?? null : null;
}

function getSpot(spotId: string | null | undefined): StaffSpotVM | null {
  return spotId ? state.spots.find((s) => s.spotId === spotId) ?? null : null;
}

function isAccessible(spotId: string | null | undefined): boolean {
  return hasSpot(spotId);
}

/** The caller's level at a spot (null = no access). */
function levelFor(spotId: string | null | undefined): AccessLevel | null {
  return getSpot(spotId)?.level ?? null;
}

/**
 * Explicit login: seeds the context from the REST login response, then
 * revalidates with myStaffContext in the background. More than one spot always
 * asks "Where are you working today?" (E17).
 */
async function hydrateFromLogin(user: StaffLoginUser): Promise<void> {
  sessionGen += 1;
  refreshInFlight = null;
  const userId = user.id ?? null;
  const staffKind = user.staffKind ?? null;
  const brand: BrandVM | null = user.brand
    ? { id: user.brand.id, name: user.brand.name, logoUrl: user.brand.logoUrl ?? null, isActive: user.brand.isActive }
    : null;
  const spots = (user.spots ?? []).map((s) => fromLoginSpot(s, user.brand));
  state = {
    ...INITIAL,
    epoch: state.epoch + 1,
    status: 'loading',
    userId,
    staffKind,
    brand,
    canManageBrand: staffKind === 'PLATFORM' || staffKind === 'BRAND_ADMIN',
    spots,
    defaultSpotId: user.spotId ?? null,
    loginSpotId: user.spotId ?? null,
  };
  // The pre-brands key is never read (A1: no legacy fallback); drop it.
  AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});

  const previous = userId ? await readSelection(userId) : null;
  if (spots.length === 0) noAccess();
  else if (spots.length === 1) activateQuietly(spots[0].spotId);
  else needsChoice(previous?.spotId ?? null);
  persistSession();
  void refresh('login');
}

/**
 * Cold start while signed in: the cached context gives an instant result, then
 * myStaffContext revalidates it. Without a cache we wait for the server.
 */
async function hydrateFromCache(userId: string | null): Promise<void> {
  sessionGen += 1;
  refreshInFlight = null;
  AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
  if (!userId) {
    setState({ ...INITIAL, status: 'loading', epoch: state.epoch + 1 });
    await refresh('coldStart');
    return;
  }
  const cached = await readSession();
  if (cached && cached.userId === userId && Array.isArray(cached.spots)) {
    state = {
      ...INITIAL,
      epoch: state.epoch + 1,
      status: 'loading',
      userId,
      staffKind: cached.staffKind ?? null,
      brand: cached.brand ?? null,
      canManageBrand: !!cached.canManageBrand,
      spots: cached.spots,
      defaultSpotId: cached.defaultSpotId ?? null,
      // The LOGIN row belongs to an earlier app run: every selection now is recorded.
      loginSpotId: null,
      fetchedAt: cached.fetchedAt ?? null,
    };
    resolveRestore(await readSelection(userId));
    void refresh('coldStart');
    return;
  }
  setState({ ...INITIAL, status: 'loading', userId, epoch: state.epoch + 1 });
  await refresh('coldStart');
}

/** Applies a fresh myStaffContext and handles lost access to the active spot. */
async function applyStaffContext(ctx: StaffContext): Promise<void> {
  if (ctx.mustChangePassword) {
    emitNotice({ kind: 'passwordChangeRequired' });
    return;
  }
  const previousActive = getSpot(state.activeSpotId);
  const spots = ctx.scope === 'NONE' ? [] : ctx.spots.map(fromStaffSpot);
  setState({
    staffKind: kindFromScope(ctx.scope) ?? state.staffKind,
    brand: ctx.brand
      ? { id: ctx.brand.id, name: ctx.brand.name, logoUrl: ctx.brand.logoUrl ?? null, isActive: ctx.brand.isActive }
      : null,
    canManageBrand: ctx.canManageBrand,
    spots,
    defaultSpotId: ctx.defaultSpotId ?? null,
    fetchedAt: Date.now(),
  });
  persistSession();

  switch (state.status) {
    case 'idle':
    case 'loading':
    case 'error':
    case 'noAccess': {
      const userId = state.userId;
      resolveRestore(userId ? await readSelection(userId) : null);
      return;
    }
    case 'needsChoice': {
      if (spots.length === 0) return noAccess();
      if (spots.length === 1) return activateQuietly(spots[0].spotId);
      if (!hasSpot(state.preselectSpotId)) {
        setState({ preselectSpotId: hasSpot(state.defaultSpotId) ? state.defaultSpotId : null });
      }
      return;
    }
    case 'ready': {
      if (hasSpot(state.activeSpotId)) return;
      const lostName = previousActive?.name ?? '';
      if (spots.length === 1) {
        // 'revalidate' tells the server too: the device's push routing and the
        // session log follow the spot it moved to.
        void setActiveSpot(spots[0].spotId, 'revalidate');
      } else if (spots.length > 1) {
        needsChoice(null);
      } else {
        noAccess();
      }
      emitNotice({ kind: 'lostAccess', name: lostName });
      return;
    }
    default:
      return;
  }
}

/**
 * Re-reads myStaffContext (single flight). Runs on login / cold start, on
 * foreground (if older than 2 min), every 10 min, on WS reconnect, on
 * SCOPE_FORBIDDEN and on pull-to-refresh.
 */
function refresh(reason: string = 'manual'): Promise<void> {
  if (state.status === 'signedOut') return Promise.resolve();
  if (refreshInFlight) return refreshInFlight;
  const gen = sessionGen;
  refreshInFlight = (async () => {
    try {
      const res = await getMyStaffContext();
      if (gen !== sessionGen || state.status === 'signedOut') return;
      if (!res.success || !res.data) {
        logger.warn(`spotStore.refresh(${reason}) failed`, res.error?.message);
        if (state.status === 'loading') setState({ status: 'error' });
        return;
      }
      await applyStaffContext(res.data);
    } finally {
      if (gen === sessionGen) refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * Counters for the switcher (myStaffSpots), polled every 30 s in the
 * foreground when the user can switch. A spot that appeared or disappeared
 * triggers a full refresh.
 */
async function refreshCounts(): Promise<void> {
  if (state.status !== 'ready' || state.spots.length <= 1) return;
  const gen = sessionGen;
  const isPlatform = state.staffKind === 'PLATFORM';
  const limit = 500;
  const res = await getMyStaffSpots({ includeInactive: !isPlatform, limit });
  if (gen !== sessionGen || getState().status === 'signedOut' || !res.success || !res.data) return;
  const byId = new Map(res.data.map((r) => [r.spotId, r]));
  let missing = false;
  const spots = state.spots.map((s) => {
    const r = byId.get(s.spotId);
    if (!r) {
      missing = true;
      return s;
    }
    return {
      ...s,
      level: isAccessLevel(r.level) ? r.level : s.level,
      isActive: r.isActive,
      pendingOrderCount: r.pendingOrderCount ?? 0,
      myOpenClaimedCount: r.myOpenClaimedCount ?? 0,
      staffCount: r.staffCount ?? 0,
      manualAwardCap: r.manualAwardCap ?? null,
    };
  });
  const known = new Set(state.spots.map((s) => s.spotId));
  const added = res.data.some((r) => !known.has(r.spotId));
  setState({ spots });
  if ((missing && res.data.length < limit) || added) void refresh('counts');
}

/**
 * Makes `spotId` the active spot:
 * 1. persists the selection (per device and user);
 * 2. epoch++ (spot-scoped screens remount, realtime resubscribes);
 * 3. leaves spot-scoped stack screens;
 * 4. for 'user' / 'choose' / 'revalidate' (lost access, moved to the only
 *    spot left): tells the server (push routing + SPOT_SWITCH row);
 * 5. for 'user' / 'choose': announces the switch (toast + haptic in
 *    SpotContextProvider). A 'revalidate' move is announced as lostAccess.
 * There is no 'push' reason: a push never switches on its own (§4.6).
 */
async function setActiveSpot(spotId: string, reason: SwitchReason): Promise<boolean> {
  const spot = getSpot(spotId);
  const userId = state.userId;
  if (!spot) return false;
  const alreadyActive = state.status === 'ready' && state.activeSpotId === spotId;
  if (alreadyActive && reason !== 'choose') return true;

  // The server's LOGIN row recorded the single login spot, but only for the
  // first selection after that login: loginSpotId is consumed here (and by a
  // quiet activation), so re-picking that spot on a later day from the cached
  // session is recorded again.
  const recordedAtLogin = reason === 'choose' && spotId === state.loginSpotId;
  const consumesLoginSpot = state.loginSpotId !== null;
  const selectedAt = Date.now();
  if (userId) void writeSelection(userId, { spotId, selectedAt });
  setState({
    status: 'ready',
    activeSpotId: spotId,
    selectedAt,
    preselectSpotId: null,
    loginSpotId: null,
    epoch: alreadyActive ? state.epoch : state.epoch + 1,
  });
  if (consumesLoginSpot) persistSession();
  if (!alreadyActive) leaveSpotScopedScreens();

  if (reason === 'user' || reason === 'choose' || reason === 'revalidate') {
    if (!recordedAtLogin) {
      void (async () => {
        try {
          const deviceId = await getInstallId();
          await apiSelectActiveSpot(spotId, deviceId);
        } catch (e) {
          logger.warn('selectActiveSpot failed', e);
        }
      })();
    }
  }
  if (reason === 'user' || reason === 'choose') {
    emitNotice({ kind: 'switched', spotId, name: spot.name, reason });
  }
  return true;
}

/**
 * On returning to the foreground: a selection from a previous local day asks
 * again (first open of the day, E17) when the user can switch.
 */
function checkNewDay(): void {
  if (state.status !== 'ready' || state.spots.length <= 1) return;
  if (state.selectedAt && state.selectedAt >= startOfToday()) return;
  needsChoice(state.activeSpotId);
}

/** Resolves true once a spot is active, false when the session ends first. */
function whenReady(): Promise<boolean> {
  return new Promise((resolve) => {
    let unsubscribe: (() => void) | null = null;
    const check = (): boolean => {
      if (state.status === 'ready' && state.activeSpotId) {
        unsubscribe?.();
        resolve(true);
        return true;
      }
      if (state.status === 'signedOut') {
        unsubscribe?.();
        resolve(false);
        return true;
      }
      return false;
    };
    if (check()) return;
    unsubscribe = subscribe(() => {
      check();
    });
  });
}

/** Sign-out: forgets everything except the per-user last spot. */
function reset(): void {
  sessionGen += 1;
  refreshInFlight = null;
  state = { ...INITIAL, status: 'signedOut', epoch: state.epoch + 1 };
  listeners.forEach((l) => l());
  AsyncStorage.multiRemove([SESSION_KEY, LEGACY_KEY]).catch(() => {});
}

export const spotStore = {
  getState,
  subscribe,
  onNotice,
  getActiveSpotId,
  getActiveSpot,
  getSpot,
  isAccessible,
  levelFor,
  hydrateFromLogin,
  hydrateFromCache,
  applyStaffContext,
  refresh,
  refreshCounts,
  setActiveSpot,
  checkNewDay,
  whenReady,
  reset,
};
