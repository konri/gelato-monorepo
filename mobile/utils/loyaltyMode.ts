/**
 * What My card and Rewards show (BRANDS_SPEC §5.3): a PURE function of the
 * overview, the persisted brand selection and the load status.
 *
 * Kept free of runtime imports so `scripts/test-loyalty-mode.js` can run it in
 * plain Node (type-only imports are erased).
 */
import type { LoyaltyOverview, LoyaltyWallet } from '@/shared/api-client/src/graphql/queries/loyalty/types';

export type LoyaltyStatus = 'idle' | 'loading' | 'ready' | 'error';

export type LoyaltyMode =
  | { kind: 'LOADING' }
  | { kind: 'ERROR' }
  /** E = 0, the user has no city. */
  | { kind: 'NO_CITY' }
  /** E = 0, no brand with rewards in the user's city. */
  | { kind: 'NO_BRANDS_IN_CITY'; cityId: string }
  /** E = 0, the city has exactly one brand and no other brand was visited recently. */
  | { kind: 'ONE_TO_DISCOVER'; brandId: string }
  /**
   * E = 0, several brands to look at: ≥ 2 in the city, or a recently visited
   * brand outside the city ("Your places" first, then the city's brands).
   */
  | { kind: 'MANY_TO_DISCOVER'; cityId: string | null }
  /** E = 1: that brand, no picker. */
  | { kind: 'SINGLE'; brandId: string }
  /** E ≥ 2: the selected brand, picker shown. */
  | { kind: 'MULTI'; brandId: string };

export type LoyaltyModeKind = LoyaltyMode['kind'];

type WalletLike = Pick<LoyaltyWallet, 'paused' | 'availablePoints' | 'readyToPickUpCount'> &
  Partial<Pick<LoyaltyWallet, 'inMyCity' | 'hasWallet' | 'lastActivityAt'>> & {
    brand: { id: string };
  };

type OverviewLike<W extends WalletLike = WalletLike> = Pick<LoyaltyOverview, 'cityId' | 'defaultBrandId'> & {
  wallets: W[];
};

/** Same window as the server's default brand (LoyaltyService DEFAULT_BRAND_ACTIVITY_MS). */
export const RECENT_BRAND_MS = 90 * 24 * 60 * 60 * 1000;

/** A wallet counts when it is not paused and has points or a reward to pick up. */
export const isEngaged = (w: WalletLike): boolean =>
  !w.paused && (w.availablePoints > 0 || w.readyToPickUpCount > 0);

/** A persisted selection is valid while that brand is in the overview and not paused. */
export const isSelectable = (o: OverviewLike, brandId: string | null | undefined): boolean =>
  !!brandId && o.wallets.some((w) => w.brand.id === brandId && !w.paused);

const isRecent = (w: WalletLike, now: number): boolean => {
  if (!w.lastActivityAt) return false;
  const at = Date.parse(w.lastActivityAt);
  return Number.isFinite(at) && now - at <= RECENT_BRAND_MS;
};

/** Active brands of the user's city (none without a city). */
const cityBrands = <W extends WalletLike>(o: OverviewLike<W>): W[] =>
  o.cityId ? o.wallets.filter((w) => !w.paused && w.inMyCity === true) : [];

/**
 * Brands outside the city that the user visited recently: the server's
 * default brand when it is not a city brand, plus any other wallet with
 * activity in the last 90 days.
 */
const recentOutsideCity = <W extends WalletLike>(o: OverviewLike<W>, now: number): W[] => {
  const inCity = new Set(cityBrands(o).map((w) => w.brand.id));
  return o.wallets.filter(
    (w) =>
      !w.paused &&
      !inCity.has(w.brand.id) &&
      (w.brand.id === o.defaultBrandId || isRecent(w, now)),
  );
};

/**
 * "Your places" of the discovery list (E = 0): the user's own active wallets
 * and recently visited brands, the recent default brand first, then server
 * order. The city's other brands follow them in the list.
 */
export function yourPlaces<W extends WalletLike>(o: OverviewLike<W>, now: number = Date.now()): W[] {
  const recent = new Set(recentOutsideCity(o, now).map((w) => w.brand.id));
  const mine = o.wallets.filter((w) => !w.paused && (w.hasWallet === true || recent.has(w.brand.id)));
  const first = mine.filter((w) => w.brand.id === o.defaultBrandId);
  return [...first, ...mine.filter((w) => w.brand.id !== o.defaultBrandId)];
}

/**
 * `now` (epoch ms) only matters for E = 0, to tell recent visits apart; it is a
 * parameter so the function stays pure in tests.
 */
export function resolveLoyaltyMode(
  overview: OverviewLike | null | undefined,
  selectedBrandId: string | null | undefined,
  status: LoyaltyStatus,
  now: number = Date.now(),
): LoyaltyMode {
  if (!overview) return status === 'error' ? { kind: 'ERROR' } : { kind: 'LOADING' };

  // Recomputed locally so a live points update switches the mode at once.
  const engaged = overview.wallets.filter(isEngaged);

  if (engaged.length === 1) return { kind: 'SINGLE', brandId: engaged[0].brand.id };

  if (engaged.length >= 2) {
    if (selectedBrandId && isSelectable(overview, selectedBrandId)) {
      return { kind: 'MULTI', brandId: selectedBrandId };
    }
    const fallback =
      overview.defaultBrandId && isSelectable(overview, overview.defaultBrandId)
        ? overview.defaultBrandId
        : engaged[0].brand.id;
    return { kind: 'MULTI', brandId: fallback };
  }

  // E = 0: discovery is based on the user's CITY (lead decision, review #11).
  // A recently visited brand outside the city never becomes the one brand to
  // discover: it is listed under "Your places", above the city's brands.
  const inCity = cityBrands(overview);
  if (inCity.length >= 2 || recentOutsideCity(overview, now).length > 0) {
    return { kind: 'MANY_TO_DISCOVER', cityId: overview.cityId ?? null };
  }
  if (inCity.length === 1) {
    return { kind: 'ONE_TO_DISCOVER', brandId: inCity[0].brand.id };
  }
  return overview.cityId
    ? { kind: 'NO_BRANDS_IN_CITY', cityId: overview.cityId }
    : { kind: 'NO_CITY' };
}

/** The brand the mode is about, if any. */
export const modeBrandId = (mode: LoyaltyMode): string | null =>
  mode.kind === 'SINGLE' || mode.kind === 'MULTI' || mode.kind === 'ONE_TO_DISCOVER'
    ? mode.brandId
    : null;
