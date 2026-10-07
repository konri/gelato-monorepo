import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { isNetworkErrorMessage } from '@/shared/api-client/src/errorEvents';
import { updateProfile } from '@/shared/api-client/src/graphql/mutations/profile/updateProfile';
import { getLoyaltyOverview } from '@/shared/api-client/src/graphql/queries/loyalty';
import type {
  LoyaltyCity,
  LoyaltyMe,
  LoyaltyOverview,
  LoyaltyOverviewData,
  LoyaltyWallet,
  ReadyToPickUpItem,
} from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { getCities } from '@/shared/api-client/src/graphql/queries/tastes';
import { onCityChanged } from '@/shared/api-client/src/loyaltyEvents';
import { isLiveUpdateFor, onPointsUpdated, type PointsLiveUpdate } from '@/shared/api-client/src/pointsEvents';
import { onLoggedOut, onSessionExpired } from '@/shared/api-client/src/session';
import { safeGetItem, safeSetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { findCityByName, localizedCityName, matchesCity } from '@/utils/cityMatch';
import { syncLanguageOnce } from '@/utils/languageSync';
import {
  isEngaged,
  modeBrandId,
  resolveLoyaltyMode,
  type LoyaltyMode,
  type LoyaltyStatus,
} from '@/utils/loyaltyMode';
import {
  readSelectedBrand,
  readSnapshot,
  readStoredUserId,
  removeSnapshot,
  saveLastCard,
  writeSelectedBrand,
  writeSnapshot,
} from '@/utils/loyaltyStorage';
import i18n from 'i18next';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

/**
 * BrandProvider (BRANDS_SPEC §5.2): the per-brand wallets, the selected brand
 * and the loyalty mode, shared by every screen.
 *
 * - Mounted at the app root (iOS NativeTabs must stay mounted, and root Stack
 *   screens such as prize/[id] need it too). It ALWAYS renders its children.
 * - Lazy: nothing is fetched until a screen calls `ensureLoaded()` (useBrands
 *   does it on mount), and only with an access token.
 * - Resets on session expiry and on explicit logout.
 */

export type BrandSelectReason = 'user' | 'push' | 'earn';

export type LastGain = { brandId: string; change: number; at: number };

/** A credit/debit as seen by the provider, for the points toast. */
export type BrandGain = PointsLiveUpdate & {
  /** The selection moved to this brand (auto-follow). */
  followed: boolean;
  /** This brand is the one My card shows now (after a possible follow). */
  isShown: boolean;
};

export interface BrandContextValue {
  status: LoyaltyStatus;
  me: LoyaltyMe | null;
  overview: LoyaltyOverview | null;
  mode: LoyaltyMode;
  /** Server order, never re-sorted on the client. */
  wallets: LoyaltyWallet[];
  /** Not paused and points > 0 or a reward to pick up. */
  engaged: LoyaltyWallet[];
  /** Not paused, not engaged (0 points, nothing to pick up). */
  others: LoyaltyWallet[];
  paused: LoyaltyWallet[];
  /** The wallet of the mode's brand (SINGLE, MULTI, ONE_TO_DISCOVER). */
  selectedWallet: LoyaltyWallet | null;
  /** Rewards claimed in the app and not picked up yet, every brand. */
  readyToPickUp: ReadyToPickUpItem[];
  cityId: string | null;
  city: LoyaltyCity | null;
  /** Epoch ms of the last successful fetch (0 = never). */
  fetchedAt: number;
  /** Shown data is from the snapshot or a live patch; a refetch is pending. */
  stale: boolean;
  /** The last fetch failed because the device is offline. */
  offline: boolean;
  /** The last fetch failed (offline or server error); data is the last good one. */
  failed: boolean;
  lastGain: LastGain | null;
  ensureLoaded: () => void;
  refresh: (opts?: { maxAgeMs?: number }) => Promise<void>;
  selectBrand: (brandId: string, reason: BrandSelectReason) => void;
  walletFor: (brandId?: string | null) => LoyaltyWallet | null;
  /** The picker is open: auto-follow pauses, rows keep their order. */
  setPickerOpen: (open: boolean) => void;
  /**
   * My card or the fullscreen card came on screen (true) or left it (false).
   * Counted, not a flag: the fullscreen card opens ON TOP of My card, and
   * closing it must not switch auto-follow off while My card is still shown
   * (review #2). Every `true` must be paired with one `false`.
   */
  setCardFocused: (focused: boolean) => void;
  /** My card or the fullscreen card is on screen right now. */
  isCardFocused: () => boolean;
  /** The brand picker is open right now. */
  isPickerOpen: () => boolean;
}

type State = {
  status: LoyaltyStatus;
  userId: string | null;
  me: LoyaltyMe | null;
  overview: LoyaltyOverview | null;
  fetchedAt: number;
  stale: boolean;
  offline: boolean;
  failed: boolean;
  selectedBrandId: string | null;
  lastGain: LastGain | null;
};

const INITIAL: State = {
  status: 'idle',
  userId: null,
  me: null,
  overview: null,
  fetchedAt: 0,
  stale: false,
  offline: false,
  failed: false,
  selectedBrandId: null,
  lastGain: null,
};

/** Credits that follow the user to the counter they are standing at. */
const AUTO_FOLLOW_SOURCES = new Set(['STAFF_TEMPLATE', 'STAFF_CUSTOM', 'ORDER']);
const PATCH_REFETCH_MS = 1500;
const EMITTER_REFETCH_MS = 300;
const ACTIVE_MAX_AGE_MS = 30_000;

// --- Gain events (consumed by NotificationBridge for the points toast) ------

type GainListener = (gain: BrandGain) => void;
const gainListeners = new Set<GainListener>();

export const onBrandGain = (listener: GainListener): (() => void) => {
  gainListeners.add(listener);
  return () => gainListeners.delete(listener);
};

const emitBrandGain = (gain: BrandGain) => {
  gainListeners.forEach((l) => {
    try {
      l(gain);
    } catch {
      /* ignore */
    }
  });
};

// Profile city healed at most once per user and app session.
const healedProfileCity = new Set<string>();

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<State>(INITIAL);
  // The ref is the source of truth so event handlers read the latest state
  // synchronously (a React updater may run only at the next render).
  const stateRef = useRef<State>(INITIAL);
  const setState = useCallback((update: (s: State) => State) => {
    const next = update(stateRef.current);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  const activated = useRef(false);
  const generation = useRef(0);
  const inflight = useRef<Promise<void> | null>(null);
  const rerun = useRef(false);
  const refetchTimer = useRef<{ id: ReturnType<typeof setTimeout>; due: number } | null>(null);
  const pickerOpen = useRef(false);
  // How many card surfaces are on screen (My card, the fullscreen card).
  const cardFocusCount = useRef(0);
  // A selection made before the user is known (cold start from a push).
  const pendingSelection = useRef<string | null>(null);
  // The socket also pings refreshEmitter right after a live patch; keep the
  // patch's 1.5 s debounce instead of refetching at once.
  const lastPatchAt = useRef(0);

  const clearTimer = () => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current.id);
    refetchTimer.current = null;
  };

  const reset = useCallback(() => {
    generation.current += 1;
    activated.current = false;
    inflight.current = null;
    rerun.current = false;
    pendingSelection.current = null;
    clearTimer();
    stateRef.current = INITIAL;
    setStateRaw(INITIAL);
  }, []);

  /** One network round trip (plus the city fallback when needed). */
  const fetchOverview = useCallback(async (): Promise<void> => {
    const gen = generation.current;
    const token = await safeGetItem('access_token');
    if (gen !== generation.current) return;
    if (!token) {
      // Not logged in (yet): try again on the next ensureLoaded().
      activated.current = false;
      return;
    }

    setState((s) => (s.overview ? s : { ...s, status: 'loading' }));

    let result = await getLoyaltyOverview({}, { token, silent: true });
    if (gen !== generation.current) return;

    if (result.success && result.data) {
      let data: LoyaltyOverviewData = result.data;
      const uid = data.me.id;

      if (!data.overview.cityId) {
        // No profile city: use the city stored on the device (F6) and heal
        // the profile so the server knows it next time.
        const localName = await safeGetItem('selectedCity');
        if (localName) {
          const cities = await getCities({ token, silent: true });
          const match = findCityByName(cities.data, localName);
          if (gen !== generation.current) return;
          if (match) {
            result = await getLoyaltyOverview({ fallbackCityId: match.id }, { token, silent: true });
            if (gen !== generation.current) return;
            if (result.success && result.data) data = result.data;
            if (!data.me.preferredCityId && !healedProfileCity.has(uid)) {
              healedProfileCity.add(uid);
              void updateProfile({ data: { preferredCityId: match.id }, token, silent: true });
            }
          }
        }
      } else if (data.me.preferredCityId && data.overview.city) {
        // The profile city wins; Spots, Tastes and News read the device copy.
        const localName = await safeGetItem('selectedCity');
        if (!localName || !matchesCity(data.overview.city, localName)) {
          await safeSetItem('selectedCity', localizedCityName(data.overview.city, i18n.language));
        }
      }
      if (gen !== generation.current) return;

      const fetchedAt = Date.now();
      const prev = stateRef.current;
      const userChanged = prev.userId != null && prev.userId !== uid;
      const pending = pendingSelection.current;
      pendingSelection.current = null;
      if (pending) void writeSelectedBrand(uid, pending);
      const selectedBrandId =
        pending ??
        (prev.userId === uid && prev.selectedBrandId != null
          ? prev.selectedBrandId
          : await readSelectedBrand(uid));
      if (gen !== generation.current) return;

      setState((s) => ({
        ...s,
        status: 'ready',
        userId: uid,
        me: data.me,
        overview: data.overview,
        fetchedAt,
        stale: false,
        offline: false,
        failed: false,
        selectedBrandId:
          pending ?? (userChanged ? selectedBrandId : s.selectedBrandId ?? selectedBrandId),
        lastGain: userChanged ? null : s.lastGain,
      }));

      void saveLastCard(data.me);
      void writeSnapshot(uid, { me: data.me, overview: data.overview, fetchedAt });
      void syncLanguageOnce(uid, data.me.language, i18n.language);
      return;
    }

    const offline = isNetworkErrorMessage(result.error?.message);
    setState((s) => ({
      ...s,
      // Keep the last data ("Updated HH:MM"); a blocking error only without data.
      status: s.overview ? 'ready' : 'error',
      offline,
      failed: true,
      stale: !!s.overview,
    }));
  }, [setState]);

  const refresh = useCallback(
    async (opts: { maxAgeMs?: number } = {}): Promise<void> => {
      if (!activated.current) return;
      const { maxAgeMs = 0 } = opts;
      const s = stateRef.current;
      if (maxAgeMs > 0 && s.fetchedAt && !s.stale && Date.now() - s.fetchedAt < maxAgeMs) return;
      if (inflight.current) {
        // A forced refresh during a fetch: run once more afterwards so a live
        // patch is never overwritten by an older response.
        if (maxAgeMs === 0) rerun.current = true;
        return inflight.current;
      }
      const run = async () => {
        do {
          rerun.current = false;
          await fetchOverview();
        } while (rerun.current && activated.current);
      };
      const p = run().finally(() => {
        if (inflight.current === p) inflight.current = null;
      });
      inflight.current = p;
      return p;
    },
    [fetchOverview],
  );

  const scheduleRefresh = useCallback(
    (delayMs: number) => {
      if (!activated.current) return;
      const due = Date.now() + delayMs;
      if (refetchTimer.current && refetchTimer.current.due <= due) return;
      clearTimer();
      const id = setTimeout(() => {
        refetchTimer.current = null;
        void refresh({ maxAgeMs: 0 });
      }, delayMs);
      refetchTimer.current = { id, due };
    },
    [refresh],
  );

  const ensureLoaded = useCallback(() => {
    if (activated.current) return;
    activated.current = true;
    const gen = generation.current;
    void (async () => {
      const uid = await readStoredUserId();
      if (uid && gen === generation.current) {
        const [snapshot, selected] = await Promise.all([readSnapshot(uid), readSelectedBrand(uid)]);
        if (gen !== generation.current) return;
        setState((s) =>
          s.overview
            ? s
            : {
                ...s,
                userId: uid,
                me: snapshot?.me ?? null,
                overview: snapshot?.overview ?? null,
                fetchedAt: snapshot?.fetchedAt ?? 0,
                stale: !!snapshot,
                status: snapshot ? 'ready' : 'loading',
                selectedBrandId: pendingSelection.current ?? selected,
              },
        );
      }
      if (gen === generation.current) await refresh({ maxAgeMs: 0 });
    })();
  }, [refresh, setState]);

  const selectBrand = useCallback(
    (brandId: string, _reason: BrandSelectReason) => {
      if (!brandId) return;
      setState((s) => ({ ...s, selectedBrandId: brandId }));
      const uid = stateRef.current.userId;
      if (uid) void writeSelectedBrand(uid, brandId);
      else pendingSelection.current = brandId;
    },
    [setState],
  );

  // Live points (WS) → patch the wallet, maybe follow, refetch shortly after.
  useEffect(() => {
    return onPointsUpdated((update) => {
      const s = stateRef.current;
      // Only the logged-in user's own updates, and only once we know who that
      // is: a socket left over from the previous session must not toast or
      // patch the next user's wallets (review #1).
      if (!isLiveUpdateFor(update, s.userId)) return;
      const brandId = update.brandId ?? null;
      const change = update.change ?? 0;
      lastPatchAt.current = Date.now();

      if (!brandId || !s.overview) {
        scheduleRefresh(brandId ? 0 : PATCH_REFETCH_MS);
        emitBrandGain({ ...update, followed: false, isShown: false });
        return;
      }

      const existing = s.overview.wallets.find((w) => w.brand.id === brandId);
      const available = update.brandAvailablePoints ?? update.availablePoints;
      const total = update.brandTotalPoints ?? update.totalPoints;
      const shownBefore = modeBrandId(resolveLoyaltyMode(s.overview, s.selectedBrandId, s.status));

      const follow =
        change > 0 &&
        !!update.source &&
        AUTO_FOLLOW_SOURCES.has(update.source) &&
        !pickerOpen.current &&
        cardFocusCount.current > 0 &&
        AppState.currentState === 'active';

      setState((prev) => {
        if (!prev.overview) return prev;
        const wallets = existing
          ? prev.overview.wallets.map((w) =>
              w.brand.id === brandId
                ? { ...w, availablePoints: available, totalPoints: total, hasWallet: true }
                : w,
            )
          : prev.overview.wallets;
        return {
          ...prev,
          overview: { ...prev.overview, wallets },
          stale: true,
          lastGain: change > 0 ? { brandId, change, at: Date.now() } : prev.lastGain,
          selectedBrandId: follow ? brandId : prev.selectedBrandId,
        };
      });
      if (follow) {
        const uid = stateRef.current.userId;
        if (uid) void writeSelectedBrand(uid, brandId);
      }

      // A brand that was not in the list yet (first credit there): refetch now.
      scheduleRefresh(existing ? PATCH_REFETCH_MS : 0);

      const after = stateRef.current;
      const shownAfter = existing
        ? modeBrandId(resolveLoyaltyMode(after.overview, after.selectedBrandId, after.status))
        : shownBefore;
      emitBrandGain({
        ...update,
        followed: follow && shownBefore !== brandId,
        isShown: follow || shownAfter === brandId,
      });
    });
  }, [scheduleRefresh, setState]);

  // Other refresh triggers.
  useEffect(() => {
    const unsubEmitter = refreshEmitter.subscribe(() =>
      scheduleRefresh(
        Date.now() - lastPatchAt.current < PATCH_REFETCH_MS ? PATCH_REFETCH_MS : EMITTER_REFETCH_MS,
      ),
    );
    const unsubCity = onCityChanged(() => void refresh({ maxAgeMs: 0 }));
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh({ maxAgeMs: ACTIVE_MAX_AGE_MS });
    });
    return () => {
      unsubEmitter();
      unsubCity();
      appState.remove();
    };
  }, [refresh, scheduleRefresh]);

  // Session end.
  useEffect(() => {
    const unsubExpired = onSessionExpired(() => {
      const uid = stateRef.current.userId;
      if (uid) void removeSnapshot(uid);
      reset();
    });
    const unsubLogout = onLoggedOut(() => reset());
    return () => {
      unsubExpired();
      unsubLogout();
      clearTimer();
    };
  }, [reset]);

  const setPickerOpen = useCallback((open: boolean) => {
    pickerOpen.current = open;
  }, []);
  const setCardFocused = useCallback((focused: boolean) => {
    cardFocusCount.current = Math.max(0, cardFocusCount.current + (focused ? 1 : -1));
  }, []);
  const isCardFocused = useCallback(() => cardFocusCount.current > 0, []);
  const isPickerOpen = useCallback(() => pickerOpen.current, []);

  const value = useMemo<BrandContextValue>(() => {
    const overview = state.overview;
    const wallets = overview?.wallets ?? [];
    const mode = resolveLoyaltyMode(overview, state.selectedBrandId, state.status);
    const walletFor = (brandId?: string | null) =>
      (brandId && wallets.find((w) => w.brand.id === brandId)) || null;
    return {
      status: state.status,
      me: state.me,
      overview,
      mode,
      wallets,
      engaged: wallets.filter(isEngaged),
      others: wallets.filter((w) => !w.paused && !isEngaged(w)),
      paused: wallets.filter((w) => w.paused),
      selectedWallet: walletFor(modeBrandId(mode)),
      readyToPickUp: overview?.readyToPickUp ?? [],
      cityId: overview?.cityId ?? null,
      city: overview?.city ?? null,
      fetchedAt: state.fetchedAt,
      stale: state.stale,
      offline: state.offline,
      failed: state.failed,
      lastGain: state.lastGain,
      ensureLoaded,
      refresh,
      selectBrand,
      walletFor,
      setPickerOpen,
      setCardFocused,
      isCardFocused,
      isPickerOpen,
    };
  }, [state, ensureLoaded, refresh, selectBrand, setPickerOpen, setCardFocused, isCardFocused, isPickerOpen]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

const FALLBACK: BrandContextValue = {
  status: 'idle',
  me: null,
  overview: null,
  mode: { kind: 'LOADING' },
  wallets: [],
  engaged: [],
  others: [],
  paused: [],
  selectedWallet: null,
  readyToPickUp: [],
  cityId: null,
  city: null,
  fetchedAt: 0,
  stale: false,
  offline: false,
  failed: false,
  lastGain: null,
  ensureLoaded: () => {},
  refresh: async () => {},
  selectBrand: () => {},
  walletFor: () => null,
  setPickerOpen: () => {},
  setCardFocused: () => {},
  isCardFocused: () => false,
  isPickerOpen: () => false,
};

/** The brand context WITHOUT activating it (root-level helpers). */
export const useBrandContext = (): BrandContextValue => useContext(BrandContext) ?? FALLBACK;

/** The brand context; loads the overview on first use. */
export function useBrands(): BrandContextValue {
  const ctx = useBrandContext();
  const { ensureLoaded, status } = ctx;
  // Also after a reset (logout / expiry → 'idle') while the screen stays mounted.
  useEffect(() => {
    if (status === 'idle') ensureLoaded();
  }, [ensureLoaded, status]);
  return ctx;
}

/** The wallet of one brand (e.g. a prize's brand), never the selection. */
export function useBrandWallet(brandId?: string | null): LoyaltyWallet | null {
  const { walletFor } = useBrands();
  return walletFor(brandId);
}

/** The brand My card shows and the mode. */
export function useSelectedBrand(): { wallet: LoyaltyWallet | null; mode: LoyaltyMode } {
  const { selectedWallet, mode } = useBrands();
  return { wallet: selectedWallet, mode };
}
