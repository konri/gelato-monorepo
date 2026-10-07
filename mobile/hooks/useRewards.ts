import { useBrands } from '@/hooks/useBrands';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import type { GraphQLResult } from '@/shared/api-client/src/graphql/types';
import {
  getBrandDetail,
  getBrandRewards,
  getBrandsInCity,
  getBrandSummary,
  type BrandDetail,
  type BrandReward,
  type BrandSummaryLite,
  type CityBrand,
  type LoyaltyWallet,
} from '@/shared/api-client/src/graphql/queries/loyalty';
import { getMyPointBalance } from '@/shared/api-client/src/graphql/queries/points/getMyPointBalance';
import {
  getMyPrize,
  getMyPrizes,
  getPrizeById,
  type Prize,
  type UserPrize,
} from '@/shared/api-client/src/graphql/queries/prizes';
import { isNetworkErrorMessage } from '@/shared/api-client/src/errorEvents';
import { onLoggedOut, onSessionExpired } from '@/shared/api-client/src/session';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Data hooks for rewards and brand pages (BRANDS_SPEC §5.5). Wallets always
 * come from the BrandProvider (`walletFor(prize.brandId)`), never from a
 * separate balance call, except as a fallback for a brand the overview does
 * not list.
 */

type Fetcher<T> = (token: string | undefined) => Promise<GraphQLResult<T>>;

export type QueryState<T> = {
  data: T | null;
  loading: boolean;
  /** The last request failed (the previous data, if any, is kept). */
  error: string | null;
  /** The last failure was a missing connection. */
  offline: boolean;
  refetch: () => Promise<void>;
  /** Refetch only when the cached result is older than the max age. */
  revalidate: () => Promise<void>;
};

// --- Small cache shared by every screen (no Apollo cache in this app) --------

type CacheEntry = { at: number; data: unknown };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<GraphQLResult<unknown>>>();

const clearCache = () => {
  cache.clear();
  inflight.clear();
};
// Per-user data must not survive a logout; public catalogs are cheap to reload.
onLoggedOut(clearCache);
onSessionExpired(clearCache);

const listeners = new Map<string, Set<() => void>>();

/** Forget a cached query (e.g. a brand's catalog after a claim changed stock). */
export const invalidateQuery = (key: string) => cache.delete(key);

/** Forget a cached query and refetch it on every screen that shows it now. */
export const refreshQuery = (key: string) => {
  cache.delete(key);
  listeners.get(key)?.forEach((l) => l());
};

const BRAND_REWARDS_MAX_AGE_MS = 60_000;
const CITY_BRANDS_MAX_AGE_MS = 60_000;

const run = async <T>(key: string | null, fetcher: Fetcher<T>): Promise<GraphQLResult<T>> => {
  const token = (await safeGetItem('access_token')) ?? undefined;
  if (!key) return fetcher(token);
  const pending = inflight.get(key) as Promise<GraphQLResult<T>> | undefined;
  if (pending) return pending;
  const p = fetcher(token).finally(() => inflight.delete(key));
  inflight.set(key, p as Promise<GraphQLResult<unknown>>);
  return p;
};

/**
 * Fetch on mount and whenever `key` changes. With `maxAgeMs`, a cached result
 * younger than that is shown without a request (the 60 s catalog cache).
 */
function useQuery<T>(
  key: string | null,
  fetcher: Fetcher<T>,
  { maxAgeMs = 0 }: { maxAgeMs?: number } = {},
): QueryState<T> {
  type State = { key: string | null; data: T | null; loading: boolean; error: string | null; offline: boolean };
  const initial = (k: string | null): State => {
    const hit = k ? cache.get(k) : undefined;
    return { key: k, data: (hit?.data as T) ?? null, loading: !!k && !hit, error: null, offline: false };
  };
  const [state, setState] = useState<State>(() => initial(key));
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const keyRef = useRef(key);
  keyRef.current = key;

  const load = useCallback(
    async (force: boolean) => {
      const k = keyRef.current;
      if (!k) {
        setState(initial(null));
        return;
      }
      const hit = cache.get(k);
      if (!force && hit && maxAgeMs > 0 && Date.now() - hit.at < maxAgeMs) {
        setState({ key: k, data: hit.data as T, loading: false, error: null, offline: false });
        return;
      }
      // Never show another key's data (e.g. the previous brand's catalog).
      setState((s) => ({
        key: k,
        data: hit ? (hit.data as T) : s.key === k ? s.data : null,
        loading: true,
        error: null,
        offline: false,
      }));
      const res = await run(k, fetcherRef.current);
      if (keyRef.current !== k) return;
      if (res.success) {
        cache.set(k, { at: Date.now(), data: res.data });
        setState({ key: k, data: res.data, loading: false, error: null, offline: false });
      } else {
        const message = res.error?.message ?? 'error';
        setState((s) => ({ ...s, key: k, loading: false, error: message, offline: isNetworkErrorMessage(message) }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxAgeMs],
  );

  useEffect(() => {
    void load(false);
  }, [key, load]);

  useEffect(() => {
    if (!key) return;
    const reload = () => void load(true);
    const set = listeners.get(key) ?? new Set<() => void>();
    set.add(reload);
    listeners.set(key, set);
    return () => {
      set.delete(reload);
      if (set.size === 0) listeners.delete(key);
    };
  }, [key, load]);

  const refetch = useCallback(() => load(true), [load]);
  const revalidate = useCallback(() => load(false), [load]);
  // Between a key change and its effect, report the new key as loading.
  const current = state.key === key ? state : initial(key);
  return {
    data: current.data,
    loading: current.loading,
    error: current.error,
    offline: current.offline,
    refetch,
    revalidate,
  };
}

// --- Brand catalog -----------------------------------------------------------

export const brandRewardsKey = (brandId: string) => `brandRewards:${brandId}`;

/** A brand's rewards on offer (cheapest first), cached for 60 s per brand. */
export function useBrandRewards(brandId: string | null | undefined): QueryState<BrandReward[]> {
  return useQuery<BrandReward[]>(
    brandId ? brandRewardsKey(brandId) : null,
    (token) => getBrandRewards(brandId as string, { token, silent: true }),
    { maxAgeMs: BRAND_REWARDS_MAX_AGE_MS },
  );
}

/** Active brands with a location in the city (discovery), cached for 60 s. */
export function useBrandsInCity(cityId: string | null | undefined): QueryState<CityBrand[]> {
  return useQuery<CityBrand[]>(
    cityId ? `brandsInCity:${cityId}` : null,
    (token) => getBrandsInCity(cityId as string, { token, silent: true }),
    { maxAgeMs: CITY_BRANDS_MAX_AGE_MS },
  );
}

/** The brand page (null: unknown or paused brand). */
export function useBrandDetail(id: string | null | undefined): QueryState<BrandDetail | null> {
  return useQuery<BrandDetail | null>(
    id ? `brandDetail:${id}` : null,
    (token) => getBrandDetail(id as string, { token, silent: true }),
    { maxAgeMs: CITY_BRANDS_MAX_AGE_MS },
  );
}

/**
 * Name and logo of a brand for a label: the wallet of the overview first (it
 * also knows paused brands), else `brand(id)`.
 */
export function useBrandLabel(brandId: string | null | undefined): BrandSummaryLite | null {
  const { walletFor, status } = useBrands();
  const wallet = walletFor(brandId);
  const needFetch = !!brandId && !wallet && status !== 'loading' && status !== 'idle';
  const { data } = useQuery<BrandSummaryLite | null>(
    needFetch ? `brandSummary:${brandId}` : null,
    (token) => getBrandSummary(brandId as string, { token, silent: true }),
    { maxAgeMs: CITY_BRANDS_MAX_AGE_MS },
  );
  if (wallet) {
    return {
      id: wallet.brand.id,
      name: wallet.brand.name,
      logoUrl: wallet.brand.logoUrl,
      isActive: wallet.brand.isActive && !wallet.paused,
    };
  }
  return data ?? null;
}

// --- Rewards of the user -------------------------------------------------------

/** One reward of a catalog (prize detail; also archived ones). */
export function usePrizeDetail(id: string | null | undefined): QueryState<Prize | null> {
  return useQuery<Prize | null>(id ? `prize:${id}` : null, (token) =>
    getPrizeById(id as string, { token, silent: true }),
  );
}

/** Every claimed reward of every brand, newest first; refreshed on focus and push. */
export function useMyRewards(): QueryState<UserPrize[]> {
  const result = useQuery<UserPrize[]>('myPrizes', (token) => getMyPrizes({}, { token, silent: true }));
  const { refetch } = result;
  useEffect(() => refreshEmitter.subscribe(() => void refetch()), [refetch]);
  return result;
}

const POLL_MS = 6_000;

/**
 * One claimed reward. Refetched when the screen regains focus, when a push
 * arrives and every few seconds while it waits to be handed over, so the
 * screen flips to "Used" right after staff redeem it.
 */
export function useMyReward(id: string | null | undefined): QueryState<UserPrize | null> {
  const result = useQuery<UserPrize | null>(id ? `myPrize:${id}` : null, (token) =>
    getMyPrize(id as string, { token, silent: true }),
  );
  const { refetch, data } = result;
  const waiting = !!data && !data.isRedeemed && data.isRedeemableNow;

  useEffect(() => refreshEmitter.subscribe(() => void refetch()), [refetch]);

  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void refetch();
      return () => {
        focused.current = false;
      };
    }, [refetch]),
  );

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => {
      if (focused.current && AppState.currentState === 'active') void refetch();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, refetch]);

  return result;
}

// --- Wallet of one brand -----------------------------------------------------

export type BrandBalance = {
  /** The overview's wallet, when the overview lists this brand. */
  wallet: LoyaltyWallet | null;
  /** Spendable points at this brand (0 when there is no wallet). */
  points: number;
  /** The brand is paused: nothing can be claimed there. */
  paused: boolean;
  /** Still unknown (overview or fallback loading). */
  loading: boolean;
};

/**
 * The points of ONE brand, e.g. the brand of a deep-linked reward (§5.5): the
 * wallet from the BrandProvider, with `myPointBalance(brandId)` as a fallback
 * when the overview does not list the brand.
 */
export function useBrandBalance(brandId: string | null | undefined): BrandBalance {
  const { walletFor, status, overview } = useBrands();
  const wallet = walletFor(brandId);
  const overviewReady = !!overview;
  // The overview does not list the brand, or it could not be loaded at all.
  const needFallback = !!brandId && !wallet && (overviewReady || status === 'error');
  const fallback = useQuery<number>(needFallback ? `balance:${brandId}` : null, async (token) => {
    const res = await getMyPointBalance(brandId as string, { token, silent: true });
    return { ...res, data: res.success ? (res.data?.availablePoints ?? 0) : null };
  });

  if (wallet) {
    return { wallet, points: wallet.availablePoints, paused: wallet.paused, loading: false };
  }
  return {
    wallet: null,
    points: fallback.data ?? 0,
    paused: false,
    loading: !overviewReady && status !== 'error' ? true : fallback.loading || (needFallback && fallback.data == null && !fallback.error),
  };
}
